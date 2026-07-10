import { load } from 'cheerio'; // We might need to install cheerio for parsing, or just use regex

async function testFMCSA(dotNumber: string) {
  const url = `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${dotNumber}`;
  
  console.log(`Testing SAFER URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      return;
    }

    const html = await response.text();
    
    // Test 1: Does it exist?
    if (html.includes('Record Inactive') || html.includes('NOT ACTIVE')) {
       console.log('Result: INACTIVE');
    } else if (html.includes('Entity Type:') || html.includes('Operating Status:')) {
       // Try to extract Operating Status
       const statusMatch = html.match(/Operating Status:[^<]*<\/th>\s*<td[^>]*><font[^>]*>([^<]+)<\/font>/i) 
                        || html.match(/Operating Status:[^<]*<\/th>\s*<td[^>]*>([^<]+)<\/td>/i);
       
       if (statusMatch && statusMatch[1]) {
           const status = statusMatch[1].trim();
           console.log(`Result: Operating Status found -> ${status}`);
           
           if (status.toUpperCase().includes('ACTIVE') && !status.toUpperCase().includes('NOT ACTIVE')) {
             console.log('FINAL: CARRIER IS ACTIVE ✅');
           } else {
             console.log('FINAL: CARRIER IS NOT ACTIVE ❌');
           }
       } else {
           console.log('Result: Could not parse operating status from HTML, but record exists.');
           
           // Simpler regex approach for the older UI
           if (html.includes('ACTIVE')) {
              console.log('Found ACTIVE keyword in HTML');
           }
       }
    } else if (html.includes('Record not found')) {
       console.log('Result: RECORD NOT FOUND');
    } else {
       console.log('Result: Unknown HTML format received. Might be blocked or Captcha.');
       console.log(html.substring(0, 500) + '...');
    }

  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Let's test a known large carrier (e.g. JB Hunt: 280036)
testFMCSA('280036');
