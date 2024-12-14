let tagsData = {}; // Store tags data globally
let searchIndex; // FlexSearch index
let filteredFiles = []; // Store filtered files based on the search query
let currentIndex = 0; // Track the current index for pagination
const batchSize = 10; // Number of items to load at a time
let uniqueTags = new Set(); // Global variable to store unique tags
let selectedTags = []; // Track all selected tags

// Initialize FlexSearch index
function initializeIndex() {
    searchIndex = new FlexSearch.Document({
        tokenize: "forward",
        threshold: 5,        // Controls typo tolerance
        depth: 3,            // Depth of fuzzy matching
        document: {
            id: "file",
            index: ["file", "tags", "description"],
            store: ["file", "description", "header", "image"] // Include image in store
        }
    });
}

async function loadTags() {
    try {
        const response = await fetch('tags.json'); // Ensure tags.json is accessible
        if (!response.ok) throw new Error("Failed to fetch tags data");
        tagsData = await response.json();

        initializeIndex(); // Initialize FlexSearch index

        // Add each item in tagsData to the FlexSearch index
        for (const [file, data] of Object.entries(tagsData)) {
            data.tags.forEach(tag => uniqueTags.add(tag)); // Collect unique tags
            searchIndex.add({
                file: file,
                tags: data.tags.join(" "), // Combine tags into a single string
                description: data.description,
                header: data.header,
                image: data.image // Add image property
            });
        }

        searchFiles(); // Display the initial batch of items
    } catch (error) {
        console.error("Error loading tags:", error);
    }
}

// Call the function to load tags on page load
loadTags();

function searchFiles() {
    const query = document.getElementById("field").value.toLowerCase().trim();
    currentIndex = 0; // Reset index for new search
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = ""; // Clear previous results
    filteredFiles = []; // Reset filtered files array

    // Use FlexSearch to perform the search and retrieve matching items
    if (query) {
        const results = searchIndex.search(query, { limit: 100 }); // Retrieve up to 100 results for pagination

        const uniqueFiles = new Set();
        results.forEach(result => {
            result.result.forEach(id => {
                if (!uniqueFiles.has(id)) {
                    uniqueFiles.add(id); // Track as seen
                    const data = searchIndex.store[id];
                    if (data) {
                        filteredFiles.push({
                            file: data.file,
                            description: data.description,
                            header: data.header,
                            image: data.image // Include image
                        });
                    }
                }
            });
        });
    } else {
        // Show all files if query is empty
        filteredFiles = Object.entries(tagsData).map(([file, data]) => ({
            file,
            description: data.description,
            header: data.header,
            image: data.image // Include image
        }));
    }

    loadMoreResults(); // Load the first batch of results
}

function loadMoreResults() {
    const resultsContainer = document.getElementById("results");

    // Get the next batch of files
    const nextBatch = filteredFiles.slice(currentIndex, currentIndex + batchSize);
    nextBatch.forEach(({ file, description, header, image }) => {
        const link = document.createElement("a");
        link.href = `content/${file}`;
        const resultBlock = document.createElement("div");
        resultBlock.classList.add("result-block");

        // Add a background image to the result block
        const imageUrl = image // Fallback to a default image
        resultBlock.style.backgroundImage = `url(/assets/imgs/${image})`;
        resultBlock.style.backgroundSize = "cover";
        resultBlock.style.backgroundPosition = "center";
        resultBlock.style.color = "white"; // Ensure text is visible on the background
        resultBlock.style.backgroundRepeat = "no-repeat"; // Ensure the image does not repeat


        const title = document.createElement("h2");
        title.textContent = header || file; // Use the header if available, fallback to file

        const desc = document.createElement("p");
        desc.textContent = description;

        resultBlock.appendChild(title);
        resultBlock.appendChild(desc);
        link.appendChild(resultBlock);
        resultsContainer.appendChild(link);
    });

    currentIndex += batchSize; // Update the current index

    // Check if there are more items to load
    if (currentIndex < filteredFiles.length) {
        observeLastItem();
    }
}

function observeLastItem() {
    const resultsContainer = document.getElementById("results");
    const items = resultsContainer.getElementsByClassName("result-block");
    const lastItem = items[items.length - 1];

    if (window.loadObserver) window.loadObserver.disconnect();

    window.loadObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadMoreResults();
        }
    });

    if (lastItem) window.loadObserver.observe(lastItem);
}

// Listen for input changes in the search field and update results in real-time
document.getElementById("field").addEventListener("input", searchFiles);

function showFilterMenu() {
    const filterMenu = document.getElementById("filterMenu");

    if (filterMenu.style.display === "none" || filterMenu.style.display === "") {
        filterMenu.style.display = "block"; // Show the filter menu
    } else {
        filterMenu.style.display = "none"; // Hide the filter menu
        return;
    }

    filterMenu.innerHTML = ""; // Clear existing buttons

    uniqueTags.forEach(tag => {
        const button = document.createElement("button");
        button.classList.add("filter-button");
        button.textContent = tag;
        button.onclick = () => filterByTag(tag);
        filterMenu.appendChild(button);
    });

    updateFilterButtonHighlights();
}

function filterByTag(tag) {
    currentIndex = 0; // Reset pagination index

    if (selectedTags.includes(tag)) {
        selectedTags = selectedTags.filter(t => t !== tag);
    } else {
        selectedTags.push(tag);
    }

    if (selectedTags.length > 0) {
        filteredFiles = Object.entries(tagsData)
            .filter(([_, data]) =>
                selectedTags.every(tag => data.tags.includes(tag))
            )
            .map(([file, data]) => ({
                file,
                description: data.description,
                header: data.header,
                image: data.image
            }));
    } else {
        filteredFiles = Object.entries(tagsData).map(([file, data]) => ({
            file,
            description: data.description,
            header: data.header,
            image: data.image
        }));
    }

    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";
    loadMoreResults();
    updateFilterButtonHighlights();
}

function updateFilterButtonHighlights() {
    const buttons = document.querySelectorAll(".filter-button");
    buttons.forEach(button => {
        if (selectedTags.includes(button.textContent)) {
            button.classList.add("selected");
        } else {
            button.classList.remove("selected");
        }
    });
}

function clearSelectedTags() {
    selectedTags = [];
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    filteredFiles = Object.entries(tagsData).map(([file, data]) => ({
        file,
        description: data.description,
        header: data.header,
        image: data.image
    }));
    loadMoreResults();
    updateFilterButtonHighlights();
}

document.getElementById("button").addEventListener("click", showFilterMenu);
