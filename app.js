document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const gridContainer = document.getElementById('products-grid');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const totalItemsText = document.getElementById('total-items');
    const loader = document.getElementById('loader');
    const emptyState = document.getElementById('empty-state');

    // State Variables
    let allData = [];
    let currentFilterText = '';
    let currentSortValue = 'price-asc';

    // Fetch DATA Json
    async function loadData() {
        try {
            console.log('Fetching data...');
            // Fetch dari internal file (data.json)
            const response = await fetch('data.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const json = await response.json();
            
            // Kita akan menggunakan seluruh all_offers
            allData = json.all_offers || [];
            
            console.log('Data loaded:', allData.length);
            
            // Sembunyikan Loader
            loader.classList.add('hidden');
            
            // Generate pertama kali (dengan sort default termurah)
            applyFiltersAndSort();
            
        } catch (error) {
            console.error('Gagal mengambil data:', error);
            loader.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:var(--danger-color); font-size: 2rem; margin-bottom: 10px;"></i>
                                <p style="color:var(--danger-color);">Gagal memuat data.json. Pastikan kamu membuka halaman ini lewat Live Server (http) dan bukan langsung lewat file lokal (file://).</p>`;
        }
    }

    // Fungsi Render HTML
    function renderOffers(offers) {
        // Update Total Items
        totalItemsText.innerText = offers.length;
        
        // Bersihkan grid
        gridContainer.innerHTML = '';
        
        if (offers.length === 0) {
            emptyState.classList.remove('hidden');
            gridContainer.classList.add('hidden');
            return;
        } else {
            emptyState.classList.add('hidden');
            gridContainer.classList.remove('hidden');
        }

        // Loop dan template render
        offers.forEach(offer => {
            // Jam fallback
            const jam = offer.hours_number ? offer.hours : 'Unknown Hours';
            const seller = offer.seller ? offer.seller : 'Unknown Seller';
            
            const cardHTML = `
                <article class="card fade-in">
                    <h2 class="card-title">${offer.nama}</h2>
                    
                    <div class="card-badges">
                        <span class="badge badge-hours">
                            <i class="fa-solid fa-clock"></i> ${jam}
                        </span>
                        <span class="badge badge-seller">
                            <i class="fa-solid fa-user-shield"></i> ${seller}
                        </span>
                        <span class="badge badge-delivery">
                            <i class="fa-solid fa-bolt"></i> ${offer.delivery || 'Instant'}
                        </span>
                    </div>

                    <div class="card-price">
                        ${offer.harga} <span>IDR</span>
                    </div>

                    <a href="${offer.url}" target="_blank" rel="noopener noreferrer" class="card-btn">
                        Lihat Penawaran <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </article>
            `;
            gridContainer.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    // Fungsi Live Sorting & Filtering
    function applyFiltersAndSort() {
        // 1. Filter Text
        let filteredData = allData.filter(item => {
            const namaLower = item.nama.toLowerCase();
            return namaLower.includes(currentFilterText.toLowerCase());
        });

        // 2. Sorting
        filteredData.sort((a, b) => {
            const priceA = a.harga_number || 0;
            const priceB = b.harga_number || 0;
            
            const hoursA = a.hours_number || 0;
            const hoursB = b.hours_number || 0;

            switch (currentSortValue) {
                case 'price-asc':
                    return priceA - priceB;
                case 'price-desc':
                    return priceB - priceA;
                case 'hours-desc':
                    return hoursB - hoursA;
                case 'hours-asc':
                    return hoursA - hoursB;
                default:
                    return priceA - priceB;
            }
        });

        // 3. Render ulanh
        renderOffers(filteredData);
    }

    // Event Listeners
    searchInput.addEventListener('input', (e) => {
        currentFilterText = e.target.value.trim();
        applyFiltersAndSort();
    });

    sortSelect.addEventListener('change', (e) => {
        currentSortValue = e.target.value;
        applyFiltersAndSort();
    });

    // Inisialisasi awal
    loadData();
});
