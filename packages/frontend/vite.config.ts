import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@/components": path.resolve(__dirname, "./src/components"),
            "@/pages": path.resolve(__dirname, "./src/pages"),
            "@/hooks": path.resolve(__dirname, "./src/hooks"),
            "@/services": path.resolve(__dirname, "./src/services"),
            "@/types": path.resolve(__dirname, "./src/types"),
            "@/utils": path.resolve(__dirname, "./src/utils"),
            "@/assets": path.resolve(__dirname, "./src/assets"),
        },
    },
    server: {
        port: 5173,
        host: true,
        proxy: {
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        outDir: "dist",
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ["react", "react-dom"],
                    router: ["react-router-dom"],
                    ui: ["lucide-react"],
                },
            },
        },
    },
    preview: {
        port: 4173,
        host: true,
    },
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
});
