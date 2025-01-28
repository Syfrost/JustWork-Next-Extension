import { useEffect } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import '../styles/globals.css';
import ButtonAuto from "../components/AutoParse/AutoParse";

export default function App({ Component, pageProps }) {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = '/webgl-back.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return (
        <>
            <canvas id="gradient-canvas"></canvas>
            <Header />
            <Component {...pageProps} />
            <ButtonAuto />
            <Footer />
        </>
    );
}

