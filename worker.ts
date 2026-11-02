import handler from "vinext/server/app-router-entry";

const worker = {
  fetch: handler.fetch.bind(handler),
};

export default worker;
