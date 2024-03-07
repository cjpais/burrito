export const sendMessage = async (message: string) => {
  if (process.env.JARED_API && process.env.ICLOUD_ID) {
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
      .then((r) => {
        if (r.ok) {
          return true;
        }
        throw new Error("jared error: failed to send");
      })
      .catch((e) => console.error("jared error", e));

    return false;
  }

  return false;
};
