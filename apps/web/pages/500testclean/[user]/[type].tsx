/* eslint-disable react/display-name */
// eslint-disable-next-line import/no-anonymous-default-export
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
// eslint-disable-next-line import/no-anonymous-default-export
export default function ({ greeting }) {
  return <div>{greeting}</div>;
}

export async function getServerSideProps() {
  return {
    props: {
      greeting: "hello world",
    },
  };
}
