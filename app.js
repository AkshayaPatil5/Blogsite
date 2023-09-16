const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const blogsFilePath = path.join(__dirname, 'blogs.json');
let blogs = [];


if (fs.existsSync(blogsFilePath)) {
  const data = fs.readFileSync(blogsFilePath, 'utf8');
  blogs = JSON.parse(data);
}

const server = http.createServer((req, res) => {
  const { method, url } = req;

  if (method === 'GET' && (url === '/' || url === '/index.html')) {
    const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html.replace('<!--BLOGS-->', generateBlogList()));
  } else if (method === 'POST') {
    if (url === '/submit-blog') {
      handleBlogSubmission(req, res);
    } else if (url.startsWith('/submit-comment/')) {
      handleCommentSubmission(req, res);
    } else if (url.startsWith('/delete-comment/')) {
      handleCommentDeletion(req, res);
    }
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

function parseRequestBody(req, callback) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });
  req.on('end', () => {
    const formData = {};
    body.split('&').forEach((pair) => {
      const [key, value] = pair.split('=');
      formData[key] = decodeURIComponent(value);
    });
    callback(formData);
  });
}

function handleBlogSubmission(req, res) {
  parseRequestBody(req, (formData) => {
    const { title, author, description } = formData;
    const blog = { title, author, description, comments: [] };
    blogs.push(blog);
    saveBlogsToJSON();
    res.writeHead(302, { 'Location': '/' });
    res.end();
  });
}

function handleCommentSubmission(req, res) {
  const blogIndex = parseInt(req.url.split('/')[2]);
  parseRequestBody(req, (formData) => {
    const comment = formData.comment;
    blogs[blogIndex].comments.push(comment);
    saveBlogsToJSON();
    res.writeHead(302, { 'Location': '/' });
    res.end();
  });
}

function handleCommentDeletion(req, res) {
  const urlParts = req.url.split('/');
  const blogIndex = parseInt(urlParts[2]);
  const commentIndex = parseInt(urlParts[3]);

  if (
    blogIndex >= 0 &&
    blogIndex < blogs.length &&
    commentIndex >= 0 &&
    commentIndex < blogs[blogIndex].comments.length
  ) {
    blogs[blogIndex].comments.splice(commentIndex, 1);
    saveBlogsToJSON();
  }

  res.writeHead(302, { 'Location': '/' });
  res.end();
}

function generateBlogList() {
  return blogs
    .map((blog, index) => `
      <div class="card mt-3">
        <div class="card-body">
          <h3 class="card-title">${blog.title}</h3>
          <p class="card-text">${blog.description} - ${blog.author}</p>
          <h5>Comments:</h5>
          <ul class="list-group">
            ${generateCommentList(blog.comments, index)}
          </ul>
          <form action="/submit-comment/${index}" method="post">
            <div class="input-group">
              <input type="text" class="form-control" name="comment" required>
              <div class="input-group-append">
                <button type="submit" class="btn btn-primary">Comment</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `)
    .join('');
}

function generateCommentList(comments, blogIndex) {
  return comments
    .map((comment, commentIndex) => `
      <li class="list-group-item">
        ${comment}
        <form action="/delete-comment/${blogIndex}/${commentIndex}" method="post" style="display: inline;">
          <button type="submit" class="btn btn-danger btn-sm ml-2">Delete</button>
        </form>
      </li>
    `)
    .join('');
}

function saveBlogsToJSON() {
  const data = JSON.stringify(blogs, null, 2);
  fs.writeFileSync(blogsFilePath, data);
}




  

