import { store } from "../fact_store";
import { get_url_preview_data } from "backend/routes/get_url_preview_data";
import { Bindings } from "backend";
import { isUrl } from "src/isUrl";

export default {
  date: "2024-01-20",
  run: async function (storage: DurableObjectStorage, env: Bindings) {
    console.log("IS RUNNING???");
    let fact_store = store(storage, { id: "" });
    let titles = await fact_store.scanIndex.aev("card/title");

    for (let title of titles) {
      let title_url = title.value;
      let url = title_url;
      if (!isUrl(url)) continue;
      let result = await get_url_preview_data(url, env);
      console.log(result);
      if (!result.success) continue;
      let data = result.data.data;
      await fact_store.assertFact({
        entity: title.entity,
        attribute: "card/link-preview",
        value: {
          url,
          description: data.description,
          image: data.image,
          logo: data.logo,
          title: data.title,
        },
        positions: {},
      });
    }
  },
};
