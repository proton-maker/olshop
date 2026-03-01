// =============================================================
// G2G.com EFT Accounts Scraper - Console Script
// Paste this entire script into the browser console (F12 > Console)
// on the G2G Escape from Tarkov Accounts page
// =============================================================

(function () {
    'use strict';

    const BASE_URL = 'https://www.g2g.com';

    // --- Helper: Extract current page number from pagination ---
    function getCurrentPage() {
        // Pagination buttons biasanya ada di row justify-center q-mt-xl q-mb-lg
        const pagRow = document.querySelector('.row.justify-center.q-mt-xl.q-mb-lg');
        if (pagRow) {
            const activeBtn = pagRow.querySelector('.q-btn--unelevated, .bg-primary, [aria-current="true"]');
            if (activeBtn) return activeBtn.textContent.trim();
        }
        // Fallback: cek dari URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('page') || '1';
    }

    // --- Helper: Extract total pages from pagination ---
    function getTotalPages() {
        const pagRow = document.querySelector('.row.justify-center.q-mt-xl.q-mb-lg');
        if (pagRow) {
            const buttons = pagRow.querySelectorAll('button, a');
            let maxPage = 1;
            buttons.forEach(btn => {
                const num = parseInt(btn.textContent.trim());
                if (!isNaN(num) && num > maxPage) maxPage = num;
            });
            return maxPage;
        }
        return null;
    }

    // --- Main: Scrape all product cards ---
    function scrapeOffers() {
        // Select all product card containers with data-v-1543ae40
        const cards = document.querySelectorAll('div[data-v-1543ae40].full-height.full-width.relative-position');

        const results = [];

        cards.forEach((card, index) => {
            try {
                // --- NAMA (Title) ---
                const titleSpan = card.querySelector('.text-body1.text-word-break.ellipsis-2-lines span[data-v-1543ae40]');
                const nama = titleSpan ? titleSpan.textContent.trim() : 'N/A';

                // --- HREF / URL ---
                const mainLink = card.querySelector('a[data-v-1543ae40][href*="/offer/"]');
                const hrefPath = mainLink ? mainLink.getAttribute('href') : '';
                const fullUrl = hrefPath ? BASE_URL + hrefPath : 'N/A';

                // --- OFFER ID ---
                const offerIdMatch = hrefPath.match(/\/offer\/(G\w+)/);
                const offerId = offerIdMatch ? offerIdMatch[1] : 'N/A';

                // --- HARGA (Price) ---
                const priceSpan = card.querySelector('span[data-v-1543ae40].text-body1.text-weight-medium');
                const hargaRaw = priceSpan ? priceSpan.textContent.trim() : '0';
                const hargaNumber = parseInt(hargaRaw.replace(/[.,\s]/g, '')) || 0;

                // --- CURRENCY ---
                const currSpan = card.querySelector('span[data-v-1543ae40].text-caption.q-ml-xs');
                const currency = currSpan ? currSpan.textContent.trim() : 'IDR';

                // --- SELLER ---
                const sellerLink = card.querySelector('.q-px-md.q-pb-md a[data-v-1543ae40].g-card-no-deco.col-auto');
                let sellerName = 'N/A';
                let sellerLevel = 'N/A';
                if (sellerLink) {
                    const nameEl = sellerLink.querySelector('.text-body2.ellipsis');
                    const levelEl = sellerLink.querySelector('.text-caption.text-font-2nd');
                    sellerName = nameEl ? nameEl.textContent.trim() : 'N/A';
                    sellerLevel = levelEl ? levelEl.textContent.trim() : 'N/A';
                }

                // --- DELIVERY TIME ---
                const deliveryChip = card.querySelector('.g-chip-counter.row.items-center div[data-v-1543ae40]');
                const deliveryTime = deliveryChip ? deliveryChip.textContent.trim() : 'N/A';

                // --- STOCK (qty available) ---
                const chipCounters = card.querySelectorAll('.g-chip-counter');
                let stock = 'N/A';
                if (chipCounters.length >= 2) {
                    stock = chipCounters[1].textContent.trim();
                }

                // --- Cek keyword "hour" di nama ---
                const containsHour = /hour/i.test(nama);

                results.push({
                    no: index + 1,
                    nama: nama,
                    harga: hargaRaw,
                    harga_number: hargaNumber,
                    currency: currency,
                    url: fullUrl,
                    offer_id: offerId,
                    seller: sellerName,
                    seller_level: sellerLevel,
                    stock: stock,
                    delivery: deliveryTime,
                    contains_hour: containsHour
                });
            } catch (err) {
                console.warn(`⚠️ Error parsing card #${index + 1}:`, err.message);
            }
        });

        return results;
    }

    // --- Execute ---
    console.clear();
    console.log('%c╔══════════════════════════════════════════════╗', 'color: #00ff88; font-weight: bold;');
    console.log('%c║   G2G EFT Accounts Scraper v1.0              ║', 'color: #00ff88; font-weight: bold;');
    console.log('%c╚══════════════════════════════════════════════╝', 'color: #00ff88; font-weight: bold;');

    const allOffers = scrapeOffers();
    const currentPage = getCurrentPage();
    const totalPages = getTotalPages();

    // --- Filter: hanya yang mengandung keyword "hour" ---
    const hourOffers = allOffers.filter(o => o.contains_hour);

    // --- Sort by harga (ascending) ---
    const sortedByPrice = [...hourOffers].sort((a, b) => a.harga_number - b.harga_number);

    // --- Buat output JSON ---
    const output = {
        scrape_info: {
            timestamp: new Date().toISOString(),
            page: currentPage,
            total_pages: totalPages,
            total_offers_on_page: allOffers.length,
            offers_with_hour_keyword: hourOffers.length,
            source_url: window.location.href
        },
        all_offers: allOffers,
        hour_keyword_offers: sortedByPrice,
        summary: {
            cheapest: sortedByPrice.length > 0 ? {
                nama: sortedByPrice[0].nama,
                harga: sortedByPrice[0].harga + ' ' + sortedByPrice[0].currency,
                url: sortedByPrice[0].url
            } : null,
            most_expensive: sortedByPrice.length > 0 ? {
                nama: sortedByPrice[sortedByPrice.length - 1].nama,
                harga: sortedByPrice[sortedByPrice.length - 1].harga + ' ' + sortedByPrice[sortedByPrice.length - 1].currency,
                url: sortedByPrice[sortedByPrice.length - 1].url
            } : null
        }
    };

    // --- Print results ---
    console.log('\n%c📊 SCRAPE INFO:', 'color: #FFD700; font-size: 14px; font-weight: bold;');
    console.log(`   Page: ${currentPage}${totalPages ? ' / ' + totalPages : ''}`);
    console.log(`   Total offers on page: ${allOffers.length}`);
    console.log(`   Offers with "hour" keyword: ${hourOffers.length}`);

    console.log('\n%c📋 SEMUA OFFERS (ALL):', 'color: #00BFFF; font-size: 14px; font-weight: bold;');
    console.table(allOffers.map(o => ({
        '#': o.no,
        Nama: o.nama.substring(0, 80) + (o.nama.length > 80 ? '...' : ''),
        Harga: o.harga + ' ' + o.currency,
        Seller: o.seller,
        Level: o.seller_level,
        Stock: o.stock,
        Delivery: o.delivery,
        Hour: o.contains_hour ? '✅' : '❌',
        URL: o.url
    })));

    console.log('\n%c🎯 OFFERS DENGAN KEYWORD "HOUR" (sorted by price ↑):', 'color: #FF4500; font-size: 14px; font-weight: bold;');
    console.table(sortedByPrice.map((o, i) => ({
        '#': i + 1,
        Nama: o.nama.substring(0, 80) + (o.nama.length > 80 ? '...' : ''),
        Harga: o.harga + ' ' + o.currency,
        Harga_Num: o.harga_number,
        Seller: o.seller,
        Level: o.seller_level,
        Stock: o.stock,
        Delivery: o.delivery,
        URL: o.url
    })));

    if (sortedByPrice.length > 0) {
        console.log('\n%c💰 TERMURAH:', 'color: #00FF00; font-size: 13px; font-weight: bold;');
        console.log(`   ${sortedByPrice[0].nama}`);
        console.log(`   Harga: ${sortedByPrice[0].harga} ${sortedByPrice[0].currency}`);
        console.log(`   URL: ${sortedByPrice[0].url}`);

        console.log('\n%c💎 TERMAHAL:', 'color: #FF69B4; font-size: 13px; font-weight: bold;');
        const last = sortedByPrice[sortedByPrice.length - 1];
        console.log(`   ${last.nama}`);
        console.log(`   Harga: ${last.harga} ${last.currency}`);
        console.log(`   URL: ${last.url}`);
    }

    console.log('\n%c📦 FULL JSON OUTPUT:', 'color: #DA70D6; font-size: 14px; font-weight: bold;');
    console.log(JSON.stringify(output, null, 2));

    // --- Simpan ke clipboard ---
    if (navigator.clipboard) {
        navigator.clipboard.writeText(JSON.stringify(output, null, 2)).then(() => {
            console.log('\n%c✅ JSON sudah di-copy ke clipboard!', 'color: #00FF00; font-size: 13px; font-weight: bold;');
        }).catch(() => {
            console.log('\n%c⚠️ Gagal copy ke clipboard. Copy manual dari JSON di atas.', 'color: #FFA500;');
        });
    }

    // --- Return untuk akses di console ---
    console.log('\n%c💡 TIP: Ketik "g2gData" di console untuk akses data JSON langsung.', 'color: #87CEEB;');
    window.g2gData = output;

    return output;
})();