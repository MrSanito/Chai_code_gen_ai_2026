import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Bricolage_Grotesque, Kalam } from "next/font/google";
import styles from "./home.module.css";
// import { PracticeDemo } from "./practice-demo";
// import { VisitorCount } from "./visitor-count";
// import { VisitorTracker } from "./visitor-tracker";

const sans = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const hand = Kalam({
  subsets: ["latin", "devanagari"],
  weight: ["400", "700"],
  variable: "--font-hand",
  display: "swap",
});

/* Change these in one place. */
const APP_NAME = "MSU Sathi"; // placeholder name, rename freely
const CHAT_HREF = "/chat";
const PRACTICE_HREF = "/practice";
const FEEDBACK_HREF = "mailto:you@example.com"; // replace with your real contact or form

export const metadata: Metadata = {
  title: `${APP_NAME}: ask anything about MSU Baroda`,
  description:
    "An unofficial, student-built assistant for MSU Baroda. Get quick answers and practice for exams. Currently in beta.",
};

const QUESTIONS = [
  { q: "Which documents do I carry on exam day?", topic: "Exams" },
  { q: "How do I apply for a hostel?", topic: "Hostels" },
  { q: "How is my SGPA calculated?", topic: "Results" },
  { q: "What are the library timings?", topic: "Library" },
  { q: "Which scholarships can I apply for?", topic: "Scholarships" },
  { q: "What happens if I fail a paper?", topic: "Exams" },
];

/* Dates from the university's own milestones page: https://msubaroda.ac.in/Milestones */
const TIMELINE = [
  { year: "1881", text: "Baroda College opens with Arts and Science faculties." },
  {
    year: "1890",
    text: "Kalabhavan is established. Today it is the Faculty of Technology and Engineering.",
  },
  {
    year: "1935",
    text: "The Secondary Teachers’ Training College is established, now the Faculty of Education and Psychology.",
  },
  {
    year: "1946",
    text: "Baroda Medical College is established, now the Faculty of Medicine.",
  },
  {
    year: "1949",
    text: "On 30 April the university comes into existence as a residential university.",
    key: true,
  },
  {
    year: "1950",
    text: "The Faculties of Fine Arts and Social Work are established.",
  },
];

export default function Home() {
  return (
    <div className={`${sans.variable} ${hand.variable} ${styles.page}`}>
      {/* <VisitorTracker /> */}

      <main>
        <section className={`${styles.wrap} ${styles.hero}`}>
          <div>
            <h1 className={styles.title}>
              Ask anything about MSU Baroda. Then practice for the exam.
            </h1>
            <p className={styles.lede}>
              A student-built assistant that answers campus, admission and exam
              questions in plain language. Made by a student, for students. The
              university doesn’t run it.
            </p>
            <div className={styles.actions}>
              <Link href={CHAT_HREF} className={`${styles.btn} ${styles.btnPrimary}`}>
                Start chatting
              </Link>
              <Link href={PRACTICE_HREF} className={`${styles.btn} ${styles.btnGhost}`}>
                Try exam practice
              </Link>
            </div>
            <p className={styles.heroNote}>
              We’re still testing, so double-check anything important.
            </p>
          </div>

          <figure className={styles.sheetWrap}>
            <div className={styles.stamp}>
              <span className={styles.stampBig}>Beta</span>
              <span className={styles.stampSmall}>still being tested</span>
            </div>
            <div className={styles.sheet}>
              <p className={styles.sheetTag}>Sample conversation</p>
              <p className={styles.question}>Where do I check my semester result?</p>
              <p className={styles.answer}>
                Semester results are declared online on the MSU Examination
                Portal. Choose your faculty and semester, then enter your seat
                number.
              </p>
              <p className={`${styles.answer} ${styles.answerGap}`}>
                Check the latest notice on the university website first, since
                the steps can change.
              </p>
              <Link href={CHAT_HREF} className={styles.askRow}>
                Ask your own question
              </Link>
            </div>
          </figure>
        </section>

        <section className={styles.band} aria-labelledby="ask-title">
          <div className={`${styles.wrap} ${styles.split}`}>
            <div>
              <h2 id="ask-title" className={styles.h2}>
                Ask in your own words
              </h2>
              <p className={styles.body}>
                No menus to click through. Type the question the way you’d ask a
                friend in your faculty and get a short, direct answer.
              </p>
            </div>
            <ul className={styles.askList}>
              {QUESTIONS.map((item) => (
                <li key={item.q} className={styles.askItem}>
                  <span className={styles.askQ}>{item.q}</span>
                  <span className={styles.askTopic}>{item.topic}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="exam" className={styles.band} aria-labelledby="exam-title">
          <div className={`${styles.wrap} ${styles.split}`}>
            <div>
              <h2 id="exam-title" className={styles.h2}>
                Exam practice that works like the exam
              </h2>
              <p className={styles.body}>
                Pick your subject, answer questions in exam format, and read the
                explanation right after each one.
              </p>
              <ul className={styles.steps}>
                <li className={styles.step}>
                  <span className={styles.stepTitle}>Choose what to practice</span>
                  Faculty, semester and subject.
                </li>
                <li className={styles.step}>
                  <span className={styles.stepTitle}>Answer like it’s the paper</span>
                  Mark one option, just like an exam sheet.
                </li>
                <li className={styles.step}>
                  <span className={styles.stepTitle}>Learn from every answer</span>
                  See why an option is right or wrong straight away.
                </li>
              </ul>
              <p className={styles.betaNote}>
                The question bank is still growing, so some subjects aren’t
                covered yet.
              </p>
            </div>
            {/* <PracticeDemo /> */}
          </div>
        </section>

        <section id="beta" className={styles.band} aria-labelledby="beta-title">
          <div className={`${styles.wrap} ${styles.split}`}>
            <div>
              <h2 id="beta-title" className={styles.h2}>
                What beta means here
              </h2>
              <p className={styles.body}>
                This is an early version, built and tested by students. Here’s
                what to keep in mind while you use it.
              </p>
            </div>
            <dl className={styles.betaList}>
              <div className={styles.betaRow}>
                <dt className={styles.betaTerm}>Answers can be wrong</dt>
                <dd className={styles.betaDef}>
                  Some topics aren’t covered yet, and some answers will be out
                  of date or incorrect.
                </dd>
              </div>
              <div className={styles.betaRow}>
                <dt className={styles.betaTerm}>Check what matters</dt>
                <dd className={styles.betaDef}>
                  For fees, deadlines and exam forms, confirm on{" "}
                  <a className={styles.link} href="https://msubaroda.ac.in">
                    msubaroda.ac.in
                  </a>{" "}
                  or at your faculty office before you act.
                </dd>
              </div>
              <div className={styles.betaRow}>
                <dt className={styles.betaTerm}>Not official</dt>
                <dd className={styles.betaDef}>
                  This project isn’t run, reviewed or endorsed by The Maharaja
                  Sayajirao University of Baroda.
                </dd>
              </div>
              <div className={styles.betaRow}>
                <dt className={styles.betaTerm}>Tell us what’s wrong</dt>
                <dd className={styles.betaDef}>
                  Found a wrong answer?{" "}
                  <a className={styles.link} href={FEEDBACK_HREF}>
                    Report it
                  </a>{" "}
                  and it gets fixed in the next update.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section id="campus" className={styles.band} aria-labelledby="campus-title">
          <div className={`${styles.wrap} ${styles.campus}`}>
            <div className={styles.campusHead}>
              <h2 id="campus-title" className={styles.h2}>
                About MSU Baroda
              </h2>
              <p className={styles.body}>
                The Maharaja Sayajirao University of Baroda is a residential
                university in Vadodara, Gujarat. It grew out of Baroda College,
                which opened in 1881, and became a university in 1949.
              </p>
            </div>
            <ol className={styles.timeline}>
              {TIMELINE.map((e) => (
                <li
                  key={e.year}
                  className={`${styles.event} ${e.key ? styles.eventKey : ""}`}
                >
                  <span className={styles.eventYear}>{e.year}</span>
                  <p className={styles.eventText}>{e.text}</p>
                </li>
              ))}
            </ol>
            <p className={styles.source}>
              Dates are from the{" "}
              <a className={styles.link} href="https://msubaroda.ac.in/Milestones">
                university’s milestones page
              </a>
              .
            </p>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerInner}`}>
          <div>
            <span className={styles.brand}>
              <span className={styles.brandMark} aria-hidden="true" />
              {APP_NAME}
            </span>
            <p className={styles.footerText}>
              Built by a student, for students. Not affiliated with, endorsed by
              or run by The Maharaja Sayajirao University of Baroda. Currently in
              beta.
            </p>
          </div>
          <Suspense fallback={<p className={styles.count}>Counting visitors…</p>}>
            {/* <VisitorCount /> */}
          </Suspense>
        </div>
      </footer>
    </div>
  );
}