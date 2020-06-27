import Head from "next/head";

export default function Title({ children }: { children?: string }) {
  return (
    <Head>
      <title>{children && `${children} | `}scratch-js</title>
    </Head>
  );
}
