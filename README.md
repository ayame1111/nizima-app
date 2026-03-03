# Avatar Atelier

A Next.js application for buying and selling Live2D models.

## Features

- **Admin Dashboard**: Securely upload `.moc3` / `.model3.json` ZIP packages.
- **Live2D Preview**: Interactive WebGL preview of models using `pixi-live2d-display`.
- **Marketplace**: Browse available models with price and details.
- **Secure Purchase**: PayPal integration for payments.
- **Instant Download**: Secure download link generated after successful payment.
- **One-of-a-kind**: Items are automatically marked as "Sold" after purchase.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Database Setup**:
    ```bash
    npx prisma migrate dev --name init
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  **Admin Access**:
    - Go to `/admin`.
    - Enter the Admin Key (default is `admin-secret` in `.env` or hardcoded in `src/app/api/admin/products/route.ts`).
    - Upload a ZIP file containing your Live2D model.
      - **Important**: The ZIP must contain a `.model3.json` file at the root or in a subfolder.

5.  **Marketplace**:
    - Go to `/` to see listed models.
    - Click on a model to view details and preview.
    - Use the PayPal button (Sandbox mode by default) to "buy".

## Project Structure

- `src/app`: Next.js App Router pages and API routes.
- `src/components`: React components (Live2DViewer, PayPalButton).
- `src/lib`: Utilities (Prisma client).
- `prisma`: Database schema.
- `public/uploads`: Publicly accessible preview files (extracted from ZIP).
- `storage/uploads`: Securely stored original ZIP files (not accessible via direct URL).

## Deployment

- Set `DATABASE_URL` in environment variables.
- Set `ADMIN_API_KEY` for security.
- Set `PAYPAL_CLIENT_ID` for production payments.
- Ensure `storage` directory is persistent if deploying to a container.
