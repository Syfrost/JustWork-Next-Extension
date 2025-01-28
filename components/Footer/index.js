import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
        <a
        href="https://github.com/ibnzUK/next-chrome-starter"
        target="_blank"
        rel="noopener noreferrer"
        >
            By Cedric  Georges
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
