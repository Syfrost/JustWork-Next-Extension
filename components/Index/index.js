import styles from '../../styles/Pages.module.css';

export default function Index({ navigateToPage }) {
  return (
    // <div className={styles.container}>
    //   <main className={styles.main}>
    //     <h1 className={styles.title}>NEXT-CHROME-STARTER</h1>
    //     <p className={styles.description}>
    //   Browser Extension built with NEXT.JS.
    // </p>
    //     <h1 className={styles.code}>Index Page ./components/Index/index.js</h1>
    //     <p>{"[ - This is Index page content - ]"}</p>
    //     <p onClick={() => navigateToPage('new')}>{"Go to New Page >"}</p>
    //   </main>
    // </div>
      <div className={styles.container}>
           <main className={styles.main}>
             <p className={styles.description}>
                 Hello world
             </p>
             <h1 className={styles.code}>Index Page ./components/Index/index.js</h1>
             <p>{"[ - This is Index page content - ]"}</p>
             <p onClick={() => navigateToPage('new')}>{"Go to New Page >"}</p>
           </main>
         </div>
  );
}
