let tagsData = {}; // Store tags data globally
let searchIndex; // FlexSearch index
let filteredFiles = []; // Store filtered files based on the search query
let currentIndex = 0; // Track the current index for pagination
const batchSize = 10; // Number of items to load at a time

// Initialize FlexSearch index
function initializeIndex() {
    searchIndex = new FlexSearch.Document({
        tokenize: "forward",
        threshold: 5,        // Controls typo tolerance
        depth: 3,            // Depth of fuzzy matching
        document: {
            id: "file",
            index: ["file", "tags", "description"],
            store: ["file", "description"]
        }
    });
    
}

// Fetch tags once when the page loads and initialize the FlexSearch index
async function loadTags() {
    try {
        const response = await fetch('tags.json'); // Ensure tags.json is accessible
        if (!response.ok) throw new Error("Failed to fetch tags data");
        tagsData = await response.json();

        initializeIndex(); // Initialize FlexSearch index

        // Add each item in tagsData to the FlexSearch index
        for (const [file, data] of Object.entries(tagsData)) {
            searchIndex.add({
                file: file,
                tags: data.tags.join(" "), // Combine tags into a single string
                description: data.description
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
    const query = document.getElementById("searchInput").value.toLowerCase().trim();
    currentIndex = 0; // Reset index for new search
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = ""; // Clear previous results
    filteredFiles = []; // Reset filtered files array

    // Use FlexSearch to perform the search and retrieve matching items
    if (query) {
        const results = searchIndex.search(query, { limit: 100 }); // Retrieve up to 100 results for pagination

        // Use a Set to track unique file IDs and avoid duplicates
        const uniqueFiles = new Set();

        results.forEach(result => {
            result.result.forEach(id => {
                if (!uniqueFiles.has(id)) {
                    uniqueFiles.add(id); // Track as seen
                    filteredFiles.push(searchIndex.store[id]); // Add unique result to filteredFiles
                }
            });
        });
    } else {
        // Show all files if query is empty
        filteredFiles = Object.entries(tagsData).map(([file, data]) => ({
            file,
            description: data.description
        }));
    }

    loadMoreResults(); // Load the first batch of results
}


// Function to load more results in batches
function loadMoreResults() {
    const resultsContainer = document.getElementById("results");

    // Get the next batch of files
    const nextBatch = filteredFiles.slice(currentIndex, currentIndex + batchSize);
    nextBatch.forEach(({ file, description }) => {
        const resultBlock = document.createElement("div");
        resultBlock.classList.add("result-block");

        const title = document.createElement("h2");
        title.textContent = file;

        const desc = document.createElement("p");
        desc.textContent = description;

        const link = document.createElement("a");
        link.href = `content/${file}`;
        link.textContent = "Read More";

        resultBlock.appendChild(title);
        resultBlock.appendChild(desc);
        resultBlock.appendChild(link);
        resultsContainer.appendChild(resultBlock);
    });

    // Update the current index
    currentIndex += batchSize;

    // Check if there are more items to load
    if (currentIndex < filteredFiles.length) {
        observeLastItem();
    }
}

// Function to observe the last item in the results list
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
document.getElementById("searchInput").addEventListener("input", searchFiles);
