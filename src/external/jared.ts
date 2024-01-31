export const sendMessage = async (message: string) => {
  const resp = await fetch(`${process.env.JARED_API}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      body: {
        message,
      },
      recipient: {
        handle: process.env.ICLOUD_ID,
      },
    }),
  })
    .then((r) => r.json())
    .catch((e) => console.error(e));

  return resp;
};
