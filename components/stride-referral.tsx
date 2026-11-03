import styles from "./stride-referral.module.css";

export const STRIDE_URL = "https://shubham404-error.github.io/CapitalSense-portfolio-/stride/";

export function StrideReferral() {
  return <section className={styles.card} aria-label="Explore Stride, our free companion">
    <div>
      <span className={styles.eyebrow}>STRIDE · FREE · BY CAPITALSENSE</span>
      <h2>A clearer plan. A small habit to build on.</h2>
      <p>Explore Stride for money learning and a fresh way to reflect on your goals. Its social and investing demos are labelled inside the app.</p>
    </div>
    <div className={styles.action}>
      <a href={STRIDE_URL} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Explore Stride for free <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
      <small>Your Paisaan plan and financial details are not passed to Stride.</small>
    </div>
  </section>;
}
