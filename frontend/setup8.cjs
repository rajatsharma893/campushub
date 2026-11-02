const fs = require('fs')
const path = require('path')

function edit(rel, fn) {
  const full = path.join(__dirname, rel)
  if (!fs.existsSync(full)) {
    console.log('Skipped (not found): ' + rel)
    return
  }
  const before = fs.readFileSync(full, 'utf8')
  const after = fn(before)
  if (after === before) {
    console.log('No change (already done or pattern not found): ' + rel)
  } else {
    fs.writeFileSync(full, after)
    console.log('Updated: ' + rel)
  }
}

// Har page ke neeche credit footer
edit('src/components/Layout.jsx', (t) => {
  if (t.includes('data-credit')) return t
  const footer =
    '</main>\n' +
    '        <footer data-credit className="border-t border-neutral-200 bg-white px-6 py-3 text-xs text-neutral-500 text-center">\n' +
    '          &copy; {new Date().getFullYear()} CampusHub. Designed and built by{\' \'}\n' +
    '          <span className="font-semibold text-neutral-900">Rajat Sharma</span>\n' +
    '        </footer>'
  return t.replace('<main className="p-6">', '<main className="p-6 flex-1">').replace('</main>', footer)
})

// Login form ke neeche credit (mobile par bhi dikhega)
edit('src/pages/Login.jsx', (t) => {
  if (t.includes('data-credit')) return t
  const credit =
    '<p data-credit className="text-center text-xs text-gray-500 mt-6">\n' +
    '            Created by <span className="font-semibold text-gray-800">Rajat Sharma</span>\n' +
    '          </p>\n' +
    '        </form>'
  return t.replace('</form>', credit)
})

// Browser ke liye author meta tag
edit('index.html', (t) => {
  if (t.includes('name="author"')) return t
  return t.replace('</head>', '    <meta name="author" content="Rajat Sharma" />\n  </head>')
})

console.log('Done')