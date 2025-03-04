import styles from './Footer.module.css';
import manifest from '../../public/manifest.json';

export default function Footer() {  //add update icon status
    return (
        <footer className={styles.footer}>
            <a
                href="https://github.com/Syfrost"
                target="_blank"
                rel="noopener noreferrer"
            >
                By Cedric Georges v{manifest.version}
                <span className={styles.logo}>
          <img
              src="icons/icon16.png"
              alt="Logo"
              width={16}
              height={16}
          />
        </span>
            </a>
        </footer>
    );
}