# Grade Stats (UPV Grades Parser)

A modern web app to parse, analyze, and share student grades. Paste your grades (from a table, spreadsheet, or plain text), view statistics and charts, and share results with a single link—no server or database required.

---

## ✨ Features

- **Paste & Parse**: Paste grades from HTML tables, spreadsheets, or plain text.
- **Statistics**: Instantly see average, median, min, max, pass rate, and standard deviation.
- **Charts**: Visualize grade distributions and pass/fail rates with interactive charts.
- **Normalization**: Convert grades to a 0-10 scale for easy comparison.
- **Custom Options**: Set max grade value and pass threshold.
- **Sorting**: Sort by student name, grade, or pass/fail status.
- **Shareable Links**: Share results and options via a single URL (data is encoded in the link, no backend needed).
- **Undo**: Restore the last cleared grades with one click.
- **Mobile Friendly**: Responsive design for all devices.

---

## 🚀 Getting Started

1. **Install dependencies:**

```bash
npm install
```

2. **Run the development server:**

```bash
npm run dev
```

3. **Open your browser:**

Go to [http://localhost:3000](http://localhost:3000)

---

## 📝 Usage

1. **Paste grades** into the input box (supports HTML tables, tab-separated, or CSV formats).
2. **Submit** to view statistics and charts.
3. **Adjust options** (max grade, pass threshold, normalization) as needed.
4. **Share**: Click the Share button to copy a link with your data and options.
5. **Switch theme**: Use the toggle in the top left for dark/light mode.

---

## 🛡️ Privacy

- **No data is sent to a server.** All parsing and analysis happens in your browser.
- **Sharing**: When you share a link, the data is compressed and encoded in the URL.

---

## 🛠️ Tech Stack

- [Next.js 15 (App Router)](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) (for modern UI components)
- [Recharts](https://recharts.org/) (for charts)
- [lz-string](https://github.com/pieroxy/lz-string) (for URL data compression)

---

## 📦 Deployment

Deploy easily on [Vercel](https://vercel.com/) or any platform that supports Next.js.

---

## 📄 License

MIT
