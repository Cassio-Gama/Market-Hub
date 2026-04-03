using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Xml;
using System.Text;

namespace MarketHub.Worker
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("🚀 Iniciando MarketHub DataWorker (Free & Reliable)...");

            string apiKey = Environment.GetEnvironmentVariable("BRAPI_TOKEN") ?? "pY7wgXLqgH18uu8fF5SeDD";
            string usagePath = Path.Combine(Directory.GetCurrentDirectory(), "usage.json");
            
            var usage = LoadUsage(usagePath);
            CheckMonthReset(usage);

            if (usage.TotalRequests >= usage.Limit) {
                Console.WriteLine($"🛑 LIMITE ATINGIDO! ({usage.TotalRequests}/{usage.Limit}).");
                return;
            }

            // Tickers 100% compatíveis com o Plano Free da Brapi
            string[] tickers = { "^BVSP", "PETR4", "VALE3", "ITUB4", "BBDC4", "BBAS3", "MGLU3", "ABEV3", "WEGE3" };
            var results = new List<TickerItem>();
            var newsItems = new List<NewsItem>();

            using (HttpClient client = new HttpClient())
            {
                // 1. Fetch Tickers
                foreach (var ticker in tickers)
                {
                    if (usage.TotalRequests >= usage.Limit) break;
                    try {
                        string url = $"https://brapi.dev/api/quote/{ticker}?token={apiKey}";
                        var response = await client.GetAsync(url);
                        usage.TotalRequests++;
                        if (response.IsSuccessStatusCode) {
                            var content = await response.Content.ReadAsStringAsync();
                            var data = JsonSerializer.Deserialize<BrapiResponse>(content);
                            if (data?.results != null && data.results.Any()) {
                                var r = data.results[0];
                                results.Add(new TickerItem {
                                    symbol = r.symbol,
                                    price = r.regularMarketPrice ?? 0,
                                    change = r.regularMarketChangePercent ?? 0,
                                    changeStr = formatChange(r.regularMarketChangePercent)
                                });
                            }
                        }
                    } catch { }
                }

                // 2. Fetch News from G1 Economia (RSS) - 100% Free & Reliable
                try {
                    Console.WriteLine("📰 Buscando notícias do G1 Economia...");
                    string rssUrl = "https://g1.globo.com/rss/g1/economia/";
                    var rssData = await client.GetByteArrayAsync(rssUrl);
                    string rssXml = Encoding.UTF8.GetString(rssData);
                    
                    // Limpeza agressiva para evitar erro de caracteres invisíveis (BOM)
                    int firstTag = rssXml.IndexOf("<");
                    if (firstTag >= 0) rssXml = rssXml.Substring(firstTag);
                    
                    XmlDocument doc = new XmlDocument();
                    doc.LoadXml(rssXml);
                    
                    var items = doc.SelectNodes("//item");
                    if (items != null) {
                        int count = 0;
                        foreach (XmlNode item in items) {
                            if (count >= 10) break;
                            newsItems.Add(new NewsItem {
                                title = item.SelectSingleNode("title")?.InnerText ?? "",
                                source = "G1 Economia",
                                url = item.SelectSingleNode("link")?.InnerText ?? "",
                                date = item.SelectSingleNode("pubDate")?.InnerText ?? ""
                            });
                            count++;
                        }
                    }
                } catch (Exception ex) { 
                    Console.WriteLine($"⚠️ Erro ao buscar notícias RSS: {ex.Message}");
                }
            }

            // Save Data
            var marketData = new MarketData { slider = results, news = newsItems };
            string dataPath = Path.Combine(Directory.GetCurrentDirectory(), "data.json");
            await File.WriteAllTextAsync(dataPath, JsonSerializer.Serialize(marketData, new JsonSerializerOptions { WriteIndented = true }));

            SaveUsage(usagePath, usage);
            Console.WriteLine($"✅ data.json atualizado. Tickers: {results.Count}. News: {newsItems.Count}. Uso: {usage.TotalRequests}/{usage.Limit}.");
        }

        static UsageData LoadUsage(string path) {
            if (!File.Exists(path)) return new UsageData { Month = DateTime.Now.Month, TotalRequests = 0, Limit = 15000 };
            return JsonSerializer.Deserialize<UsageData>(File.ReadAllText(path));
        }

        static void SaveUsage(string path, UsageData data) => 
            File.WriteAllText(path, JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true }));

        static void CheckMonthReset(UsageData data) {
            if (data.Month != DateTime.Now.Month) {
                data.Month = DateTime.Now.Month;
                data.TotalRequests = 0;
            }
        }

        static string formatChange(double? change) => 
            (change >= 0 ? "+" : "") + change?.ToString("F2") + "%";
    }

    public class BrapiResponse { public List<BrapiResult> results { get; set; } }
    public class BrapiResult {
        public string symbol { get; set; }
        public double? regularMarketPrice { get; set; }
        public double? regularMarketChangePercent { get; set; }
    }
    public class MarketData { public List<TickerItem> slider { get; set; } public List<NewsItem> news { get; set; } }
    public class TickerItem {
        public string symbol { get; set; }
        public double price { get; set; }
        public double change { get; set; }
        public string changeStr { get; set; }
    }
    public class NewsItem {
        public string title { get; set; }
        public string source { get; set; }
        public string url { get; set; }
        public string date { get; set; }
    }
    public class UsageData { public int Month { get; set; } public int TotalRequests { get; set; } public int Limit { get; set; } }
}
