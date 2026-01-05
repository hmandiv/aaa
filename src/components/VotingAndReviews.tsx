import React from "react";
import styles from "../css_modules/VotingAndReviewsStyles.module.css"; // Adjust the path as necessary

const VotingAndReviews = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Voting and Reviews</h1>
      <p className={styles.description}>
        As members, holders, and investors in AAA, we all stand to gain
        significant benefits by working together to boost adoption, price, and
        liquidity. Simple actions like leaving reviews, voting for AAA, and
        engaging on various platforms and apps can make a big difference. Below,
        you'll find helpful walkthrough videos and links to guide you.
      </p>
      <p className={styles.description}>
        When many of us put in a little effort, the collective impact can be
        substantial!
      </p>

      {/* 🎥 Video Tutorial Section */}
      <section className={styles.videoSection}>
        <h2 className={styles.subtitle}>Watch How to Support AAA 👇</h2>
        <div className={styles.videoWrapper}>
          <iframe
            width="100%"
            height="400"
            src="https://www.youtube.com/embed/BBjIEQh9uUk" // Replace with your real video URL if needed
            title="AAA Voting & Review Walkthrough"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </section>

      {/* ✅ Dexscreener Section */}
      <section className={styles.section}>
        <h2 className={styles.subtitle}>Dexscreener</h2>
        <p className={styles.description}>
          Dexscreener has approximately 20 million viewers per month! Let's drop
          an emoji to show everyone that we've got an awesome community here at
          AAA!
        </p>
        <a
          href="https://dexscreener.com/algorand/6za6z3ju44wiwoucknte2ukpfcxfdmj7hrttphnco55jx2jj3brd5x2voe"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          Visit AAA on Dexscreener
        </a>
      </section>
    </div>
  );
};

export default VotingAndReviews;
