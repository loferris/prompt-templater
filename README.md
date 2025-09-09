# AI Prompt Builder

A Next.js application for creating, managing, and using AI prompt templates across multiple platforms including Midjourney, Stable Diffusion, and Flux.

## Features

- Create and manage prompt templates with customizable variables
- Support for multiple AI image generation platforms
- Import/export templates from Notion databases
- TypeScript support with strict type checking
- Responsive UI built with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- API keys for the services you want to use:
  - Notion (optional, for template management)
  - OpenRouter (required for AI enhancements)
  - Midjourney, Stable Diffusion, Flux (optional, for image generation)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ai-prompt-builder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add your API keys.

### Environment Variables

The following environment variables can be configured in your `.env.local` file:

- `NEXTAUTH_URL` - The URL of your application
- `NEXTAUTH_SECRET` - A random string used for authentication
- `NOTION_API_KEY` - Notion API key for template management
- `NOTION_DATABASE_ID` - ID of the Notion database for templates
- `OPENROUTER_API_KEY` - API key for OpenRouter (unified access to multiple LLMs)
- `OPENROUTER_MODEL` - The model to use for AI enhancements
- Various platform-specific keys for image generation services

See `.env.example` for a complete list of configuration options.

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
app/          # Next.js app router pages
components/   # React components
data/         # Data files and utilities
docs/         # Documentation
lib/          # Utility libraries
src/          # Source code
```

## Testing

Run the Notion client tests:
```bash
npm run test:notion
npm run test:notion-ts
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.