# Environment Setup

## Client Environment Variables

Create a `.env` file in the `client/` directory with:

```env
VITE_TMDB_API_READ_ACCESS_TOKEN='your_tmdb_api_token_here'
```

## Server Environment Variables

Create a `.env` file in the `server/` directory with:

```env
MONGO_URI="your_mongodb_connection_string_here"
```

## Important Notes

- Both `.env` files are gitignored to protect sensitive credentials
- The client `.env` must use the `VITE_` prefix for Vite to expose variables to the browser
- Never commit `.env` files to version control
