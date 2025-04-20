/**
 * BookHaven Shop Page Functionality
 * Handles all sorting and filtering for the shop page
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get key elements
    const sortSelect = document.getElementById('sort');
    const productsContainer = document.getElementById('products-container');
    const productsContainerPage2 = document.getElementById('products-container-page2');
    const priceRangeInput = document.getElementById('priceRange');
    const priceValueDisplay = document.getElementById('priceValue');
    const categoryCheckboxes = document.querySelectorAll('.form-check-input[type="checkbox"][id^="fiction"], .form-check-input[type="checkbox"][id^="non-fiction"], .form-check-input[type="checkbox"][id^="mystery"], .form-check-input[type="checkbox"][id^="scifi"], .form-check-input[type="checkbox"][id^="romance"], .form-check-input[type="checkbox"][id^="poetry"], .form-check-input[type="checkbox"][id^="finance"]');
    const authorCheckboxes = document.querySelectorAll('.form-check-input[type="checkbox"][id^="author"]');
    const ratingRadios = document.querySelectorAll('.form-check-input[type="radio"][id^="rating"]');
    
    // Get products from both containers
    const page1Products = Array.from(productsContainer.querySelectorAll('.col-6.col-md-4'));
    const page2Products = Array.from(productsContainerPage2.querySelectorAll('.col-6.col-md-4'));
    const allProducts = [...page1Products, ...page2Products];
    
    // Track which page is currently active
    let currentPage = 1;

    // Cache initial product order for reset
    const initialProductOrder = allProducts.slice();
    
    // Initialize variables to track current filters
    let currentPriceRange = priceRangeInput ? parseInt(priceRangeInput.value) : 50;
    let selectedCategories = Array.from(categoryCheckboxes)
                                .filter(cb => cb.checked)
                                .map(cb => cb.id);
    let selectedAuthors = [];
    let minimumRating = 3.0; // Default to 3-star minimum
    
    // Setup event listeners
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFiltersAndSort);
    }
    
    if (priceRangeInput) {
        priceRangeInput.addEventListener('input', function() {
            currentPriceRange = parseInt(this.value);
            if (priceValueDisplay) {
                priceValueDisplay.textContent = currentPriceRange + ' TND';
            }
            applyFiltersAndSort();
        });
    }
    
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            selectedCategories = Array.from(categoryCheckboxes)
                                    .filter(cb => cb.checked)
                                    .map(cb => cb.id);
            applyFiltersAndSort();
        });
    });
    
    authorCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            selectedAuthors = Array.from(authorCheckboxes)
                                .filter(cb => cb.checked)
                                .map(cb => cb.id.replace('author', ''));
            applyFiltersAndSort();
        });
    });
    
    ratingRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                minimumRating = parseFloat(this.id.replace('rating', ''));
                applyFiltersAndSort();
            }
        });
    });
    
    // Toggle "Show more authors" functionality
    const toggleAuthorsLink = document.getElementById('toggle-authors');
    const moreAuthorsSection = document.getElementById('more-authors');

    if (toggleAuthorsLink && moreAuthorsSection) {
        toggleAuthorsLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            const isExpanded = moreAuthorsSection.style.display !== 'none';
            
            if (isExpanded) {
                // Hide additional authors
                moreAuthorsSection.style.display = 'none';
                toggleAuthorsLink.textContent = 'Show more authors';
            } else {
                // Show additional authors
                moreAuthorsSection.style.display = 'block';
                toggleAuthorsLink.textContent = 'Show less authors';
            }
        });
        
        // Also add the additional author checkboxes to the event listeners
        const additionalAuthorCheckboxes = moreAuthorsSection.querySelectorAll('.form-check-input[type="checkbox"][id^="author"]');
        additionalAuthorCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                selectedAuthors = Array.from(document.querySelectorAll('.form-check-input[type="checkbox"][id^="author"]:checked'))
                                    .map(cb => cb.id.replace('author', ''));
                applyFiltersAndSort();
            });
        });
    }
    
    // Main function to apply all filters and sorting
    function applyFiltersAndSort() {
        // First filter products from both pages
        const filteredProducts = allProducts.filter(product => {
            // Get product data
            const price = parseFloat(product.dataset.price);
            const category = product.dataset.category;
            const rating = parseFloat(product.dataset.rating);
            const authorElement = product.querySelector('.text-muted.mb-1');
            const author = authorElement ? authorElement.textContent.trim() : '';
            
            // Apply price filter
            if (price > currentPriceRange) return false;
            
            // Apply category filter
            if (selectedCategories.length > 0 && !selectedCategories.includes(category)) return false;
            
            // Apply author filter (if any selected)
            if (selectedAuthors.length > 0) {
                const authorMatch = selectedAuthors.some(authorId => {
                    const authorName = document.querySelector(`label[for="author${authorId}"]`).textContent.trim();
                    return author.includes(authorName.split(' (')[0]);
                });
                if (!authorMatch) return false;
            }
            
            // Apply rating filter
            if (rating < minimumRating) return false;
            
            // Product passed all filters
            return true;
        });
        
        // Then sort filtered products
        const sortOption = sortSelect ? sortSelect.value : 'Popularity';
        filteredProducts.sort((a, b) => {
            switch(sortOption) {
                case 'Price: Low to High':
                    return parseFloat(a.dataset.price) - parseFloat(b.dataset.price);
                
                case 'Price: High to Low':
                    return parseFloat(b.dataset.price) - parseFloat(a.dataset.price);
                
                case 'Rating':
                    return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
                    
                case 'Newest Arrivals':
                    return new Date(b.dataset.date) - new Date(a.dataset.date);
                    
                default: // Popularity - use rating as proxy
                    return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
            }
        });
        
        // Hide all products first
        allProducts.forEach(product => {
            product.style.display = 'none';
        });
        
        // Split filtered products between pages (9 per page)
        const page1FilteredProducts = filteredProducts.slice(0, 9);
        const page2FilteredProducts = filteredProducts.slice(9);
        
        // Show the filtered products for the current page
        if (currentPage === 1) {
            page1FilteredProducts.forEach(product => {
                product.style.display = '';
                productsContainer.appendChild(product);
            });
            
            // If all filtered products fit on page 1, disable page 2 button
            const page2Link = document.querySelector('.pagination .page-item:nth-child(3)');
            const nextLink = document.querySelector('.pagination .page-item:last-child');
            if (page2Link && nextLink) {
                if (page2FilteredProducts.length === 0) {
                    page2Link.classList.add('disabled');
                    nextLink.classList.add('disabled');
                } else {
                    page2Link.classList.remove('disabled');
                    nextLink.classList.remove('disabled');
                }
            }
        } else {
            page2FilteredProducts.forEach(product => {
                product.style.display = '';
                productsContainerPage2.appendChild(product);
            });
            
            // If there are no products on page 2, go back to page 1
            if (page2FilteredProducts.length === 0 && page1FilteredProducts.length > 0) {
                document.querySelector('.pagination .page-item:nth-child(2) .page-link').click();
            }
        }
        
        // Update product count display - IMPROVED VERSION
        const countDisplay = document.querySelector('.product-count');
        if (countDisplay) {
            // Calculate the range of products being displayed
            const productsOnCurrentPage = currentPage === 1 ? page1FilteredProducts.length : page2FilteredProducts.length;
            const startCount = productsOnCurrentPage === 0 ? 0 : (currentPage - 1) * 9 + 1;
            const endCount = startCount + productsOnCurrentPage - 1;
            
            // Update the text with appropriate message based on filter results
            if (filteredProducts.length === 0) {
                countDisplay.textContent = `No books match your filters`;
            } else {
                countDisplay.textContent = `Showing ${startCount}-${endCount} of ${filteredProducts.length} books`;
            }
        }
        
        // Update category counts in sidebar
        updateCategoryCounts(filteredProducts);
    }
    
    // Add this new helper function to update the category counts
    function updateCategoryCounts(filteredProducts) {
        // Count products by category
        const categoryCounts = {};
        allProducts.forEach(product => {
            const category = product.dataset.category;
            if (!categoryCounts[category]) categoryCounts[category] = 0;
        });
        
        // Count filtered products by category
        filteredProducts.forEach(product => {
            const category = product.dataset.category;
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
        
        // Update counts in sidebar
        categoryCheckboxes.forEach(checkbox => {
            const category = checkbox.id;
            const label = document.querySelector(`label[for="${category}"]`);
            if (label) {
                // Extract category name from current label (remove existing count)
                const categoryName = label.textContent.replace(/\(\d+\)$/, '').trim();
                // Update with new count
                const count = categoryCounts[category] || 0;
                label.textContent = `${categoryName} (${count})`;
            }
        });
    }
    
    // Handle pagination functionality
    function setupPagination() {
        const paginationLinks = document.querySelectorAll('.pagination .page-link');
        const page1Link = document.querySelector('.pagination .page-item:nth-child(2) .page-link');
        const page2Link = document.querySelector('.pagination .page-item:nth-child(3) .page-link');
        const page3Link = document.querySelector('.pagination .page-item:nth-child(4) .page-link');
        const prevLink = document.querySelector('.pagination .page-item:first-child .page-link');
        const nextLink = document.querySelector('.pagination .page-item:last-child .page-link');
        
        if (page1Link) {
            page1Link.addEventListener('click', function(e) {
                e.preventDefault();
                // Show page 1 container, hide page 2 container
                productsContainer.style.display = '';
                productsContainerPage2.style.display = 'none';
                currentPage = 1;
                
                // Update active state
                const activeItem = document.querySelector('.pagination .active');
                if (activeItem) activeItem.classList.remove('active');
                page1Link.parentElement.classList.add('active');
                
                // Update prev/next buttons
                prevLink.parentElement.classList.add('disabled');
                nextLink.parentElement.classList.remove('disabled');
                
                // Re-apply filters for the current page
                applyFiltersAndSort();
            });
        }
        
        if (page2Link) {
            page2Link.addEventListener('click', function(e) {
                e.preventDefault();
                // Hide page 1 container, show page 2 container
                productsContainer.style.display = 'none';
                productsContainerPage2.style.display = '';
                currentPage = 2;
                
                // Update active state
                const activeItem = document.querySelector('.pagination .active');
                if (activeItem) activeItem.classList.remove('active');
                page2Link.parentElement.classList.add('active');
                
                // Update prev/next buttons
                prevLink.parentElement.classList.remove('disabled');
                if (page3Link) {
                    nextLink.parentElement.classList.remove('disabled');
                } else {
                    nextLink.parentElement.classList.add('disabled');
                }
                
                // Re-apply filters for the current page
                applyFiltersAndSort();
            });
        }
        
        // Setup prev/next buttons
        if (prevLink) {
            prevLink.addEventListener('click', function(e) {
                e.preventDefault();
                if (!prevLink.parentElement.classList.contains('disabled')) {
                    if (currentPage > 1) {
                        document.querySelector(`.pagination .page-item:nth-child(${currentPage}) .page-link`).click();
                    }
                }
            });
        }
        
        if (nextLink) {
            nextLink.addEventListener('click', function(e) {
                e.preventDefault();
                if (!nextLink.parentElement.classList.contains('disabled')) {
                    document.querySelector(`.pagination .page-item:nth-child(${currentPage + 2}) .page-link`).click();
                }
            });
        }
    }
    
    // Add functionality to grid/list view buttons
    const gridViewBtn = document.querySelector('.btn-group .btn:first-child');
    const listViewBtn = document.querySelector('.btn-group .btn:last-child');
    
    if (gridViewBtn && listViewBtn) {
        gridViewBtn.addEventListener('click', function() {
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            allProducts.forEach(product => {
                product.classList.remove('list-view');
                product.classList.remove('col-12');
                product.classList.add('col-6');
                product.classList.add('col-md-4');
            });
        });
        
        listViewBtn.addEventListener('click', function() {
            listViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
            allProducts.forEach(product => {
                product.classList.add('list-view');
                product.classList.add('col-12');
                product.classList.remove('col-6');
                product.classList.remove('col-md-4');
                
                // Add list view styling to product cards
                const card = product.querySelector('.card');
                if (card && !card.classList.contains('list-view-card')) {
                    card.classList.add('list-view-card');
                    card.classList.add('flex-row');
                    
                    const img = card.querySelector('.card-img-top');
                    if (img) {
                        img.style.maxWidth = '200px';
                        img.style.height = 'auto';
                        img.style.objectFit = 'cover';
                    }
                }
            });
        });
    }
    
    // Add CSS styles for list view
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .list-view-card {
            display: flex !important;
            flex-direction: row !important;
        }
        
        .list-view-card .card-img-top {
            max-width: 150px;
            height: 100%;
            object-fit: cover;
        }
        
        .list-view-card .card-body {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        
        @media (max-width: 768px) {
            .list-view-card {
                flex-direction: column !important;
            }
            .list-view-card .card-img-top {
                max-width: 100%;
            }
        }
    `;
    document.head.appendChild(styleElement);
    
    // Initialize filters and sorting on page load
    applyFiltersAndSort();
    
    // Price range value display initialization
    if (priceRangeInput && priceValueDisplay) {
        priceValueDisplay.textContent = priceRangeInput.value + ' TND';
    }

    // Call the pagination setup at the end of the DOMContentLoaded event
    setupPagination();
});