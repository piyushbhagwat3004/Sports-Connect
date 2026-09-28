import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useRouter } from "next/router";
import UserLayout from "@/layout/UserLayout";

const inter = Inter({ subsets: ["latin"] });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const router = useRouter();

  return (
    <UserLayout>
      <Head>
        <title>SportConnect - Connect Compete Conquer</title>
        <meta name="description" content="The Ultimate sports networking platform where athletes, coaches, and sports professionals unite to build their careers and chase their dreams" />
        <link rel="icon" href="/favicon.ico" />
        {/* Font Awesome for icons */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
        />
      </Head>
      
      <div className={styles.container}>
        <div className={styles.mainContainer}>
          <div className={styles.mainContainer_left}>
            <h1>Connect Compete Conquer..</h1>
            <p>
              The Ultimate sports networking platform where athletes, coaches,
              and sports professionals unite to build their careers and chase their dreams
            </p>

            <div 
              onClick={() => {
                router.push("/login")
              }} 
              className={styles.buttonJoin}
            >
              <p>Connect Now</p>
            </div>
          </div>

          <div className={styles.mainContainer_right}>
            <Image 
              src="/images/homemain_connection.png" 
              alt="Home connection" 
              width={700} 
              height={500}
              priority
              style={{
                width: '100%',
                height: 'auto',
                maxWidth: '700px'
              }}
            />
          </div>
        </div>

        {/* Feature highlights */}
        <div className={styles.featuresSection}>
          <div className={styles.featureItem}>
            <i className="fa-solid fa-users"></i>
            <span>Network with Athletes</span>
          </div>
          <div className={styles.featureItem}>
            <i className="fa-solid fa-calendar-check"></i>
            <span>Join Events</span>
          </div>
          <div className={styles.featureItem}>
            <i className="fa-solid fa-trophy"></i>
            <span>Compete & Win</span>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}