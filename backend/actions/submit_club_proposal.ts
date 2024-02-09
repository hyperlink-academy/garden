"use server";

export async function submit_club_proposal(formData: FormData) {
  const name = formData.get("name");
  const email = formData.get("email");
  const about = formData.get("about");
  const activity = formData.get("activity");
  const structure = formData.get("structure");
  const success = formData.get("success");
  if (!email || !name || !about || !activity || !structure || !success) {
    return;
  }

  const postmarkApiToken = process.env.POSTMARK_API_TOKEN;
  if (!postmarkApiToken) return;

  let res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": postmarkApiToken,
    },
    body: JSON.stringify({
      To: "contact@hyperlink.academy",
      From: "forms@hyperlink.academy",
      CC: email,
      Subject: `Club Proposal from ${name} - ${email}`,
      ReplyTo: email,
      TextBody: `
		New internet club proposal!\n\n
		Name: ${name}\n\n
		Email: ${email}\n\n
		What's your club about?:\n ${about}\n\n
		What activity are participants doing?:\n ${activity}\n\n
		What's the structure?:\n ${structure}\n\n
		What does success look like?:\n ${success}
		`,
    }),
  });
  console.log(await res.json());
  return { data: {} };

  // return { data: { success: true, data } } as const;
}
