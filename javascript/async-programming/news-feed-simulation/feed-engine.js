function generateRandomSentence() {
  const subjects = [
    "The developer",
    "A curious cat",
    "The engineer",
    "My friend",
    "The robot",
  ];
  const verbs = ["builds", "explores", "discovers", "creates", "improves"];
  const objects = [
    "a new application",
    "complex systems",
    "an interesting idea",
    "the project",
    "a solution",
  ];

  const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

  return `${random(subjects)} ${random(verbs)} ${random(objects)}.`;
}

const POSTS = [];
const SIZE = 5;
let page = 0;
let globalPostCounter = 0;

function createPost() {
  setInterval(() => {
    const post = {
      postId: globalPostCounter++,
      post: generateRandomSentence(),
    };

    POSTS.unshift(post); // Newest post appears first
    console.log(`Created: ${post.postId} :: ${post.post}`);
  }, 1000);
}

function listPosts() {
  setInterval(() => {
    const start = page * SIZE;
    const posts = POSTS.slice(start, start + SIZE);

    console.log(`\n--- Offset page ${page} (start: ${start}) ---\n`);
    for (const post of posts) {
      console.log(`${post.postId} :: ${post.post}`);
    }

    page++;
  }, 5000);
}

/** Simulation :: Offset based pagination */
function listPosts() {
  setInterval(() => {
    const start = page * SIZE;
    const posts = POSTS.slice(start, start + SIZE);

    console.log(`\n--- Offset page ${page} (start: ${start}) ---\n`);
    for (const post of posts) {
      console.log(`${post.postId} :: ${post.post}`);
    }

    console.log("\n");

    page++;
  }, 5000);
}

/** Simulation :: Cursor based pagination */
function listPosts2() {
  let lastSeenPostId = -1;

  setInterval(() => {
    // POSTS is newest-first, so this keeps the display order.
    const posts = POSTS.filter((post) => post.postId > lastSeenPostId);

    console.log("\n--- Posts since last check ---");

    if (posts.length === 0) {
      console.log("No new posts.");
      return;
    }

    for (const post of posts) {
      console.log(`${post.postId} :: ${post.post}`);
    }

    console.log("\n");

    lastSeenPostId = posts[0].postId; // Highest ID in this batch
  }, 5000);
}

createPost();
listPosts();
