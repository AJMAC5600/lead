# LeadFlow - ERP Lead Management

A modern, feature-rich lead management system built with vanilla HTML, CSS, and JavaScript. Designed as a PWA for offline access with a responsive dark/light theme interface.

## Features

### Dashboard
- Real-time stats (Total Leads, Open, Won, Lost)
- Conversion ratio & revenue forecast
- Goal tracking with progress bars
- Lead trends chart (monthly/weekly)
- Top leads by score
- Performance metrics per executive

### Lead Management
- Full CRUD operations for leads
- Lead scoring system (0-100)
- Priority & status tracking
- Multi-filter search (status, priority, source, date range)
- Saved filter chips
- Bulk actions (assign, change status, delete, export)
- Import/Export (CSV, Excel, Google Sheets)

### Sales Pipeline
- Kanban-style drag-and-drop interface
- Customizable pipeline stages
- Stage management (add, edit, reorder, delete)
- Color-coded stages
- Value tracking per stage

### Follow-Ups
- Calendar view
- Tab-based filtering (Upcoming, Today, Overdue, Completed)
- Priority-based scheduling

### Communications
- Email, SMS, and call logging
- Timeline view of all interactions
- Tab filtering by communication type

### Documents
- Document management (upload, download, share)
- Document templates (Proposal, Contract, Invoice, Quote)

### Reports & Analytics
- Revenue charts
- Lead status distribution
- Executive performance table
- Conversion funnel visualization
- Lead sources pie chart
- Scheduled reports

### Form Builder
- Drag-and-drop form creation
- Custom field types
- QR code generation for forms
- Embeddable form support

### Additional Features
- **PWA Support** - Install as a standalone app
- **Offline Detection** - Sync when reconnected
- **Dark Mode** - Toggle between light and dark themes
- **Multi-Currency** - USD, EUR, GBP, INR support
- **Global Search** - Search across leads, contacts, companies
- **Notifications** - Real-time notification panel
- **Fullscreen Mode** - Immersive view
- **Responsive Design** - Works on all screen sizes
- **Touch Gestures** - Mobile-friendly interactions
- **Audit Log** - Track all system changes
- **Role-Based Access** - Admin, Manager, Executive, Viewer roles

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Charts:** Chart.js
- **Icons:** Font Awesome 6.4
- **Fonts:** Inter (Google Fonts)
- **Date Picker:** Flatpickr
- **Storage:** LocalStorage (client-side)

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AJMAC5600/lead.git
```

2. Navigate to the project directory:
```bash
cd lead
```

3. Open `index.html` in your browser:
```bash
# On Windows
start index.html

# On macOS
open index.html

# On Linux
xdg-open index.html
```

## Project Structure

```
lead/
├── index.html      # Main HTML file with all page layouts
├── app.js          # Application logic and functionality
├── styles.css      # All CSS styles and responsive design
└── README.md       # Project documentation
```

## Usage

1. **Dashboard** - View your sales overview and key metrics
2. **Leads** - Add, edit, filter, and manage your leads
3. **Pipeline** - Drag and drop leads between stages
4. **Follow-Ups** - Schedule and track follow-up activities
5. **Communications** - Log emails, calls, and SMS
6. **Documents** - Manage proposals, contracts, and templates
7. **Reports** - Analyze sales performance with charts
8. **Form Builder** - Create custom lead capture forms
9. **Settings** - Configure stages, profiles, and integrations

## Browser Support

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

## License

This project is open source and available for personal and commercial use.

## Author

**AJMAC5600** - [GitHub Profile](https://github.com/AJMAC5600)
