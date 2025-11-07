const { readFile, writeFile } = require("fs").promises;
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const topicsPath = path.join(rootDir, "public", "data", "topics.json");
const oppekavaPath = path.join(rootDir, "public", "data", "oppekava.json");

async function loadJson(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function main() {
  const [topicsData, oppekavaData] = await Promise.all([loadJson(topicsPath), loadJson(oppekavaPath)]);
  const topics = Array.isArray(topicsData) ? topicsData : [];
  const rawTopics = Array.isArray((oppekavaData && oppekavaData.topics)) ? oppekavaData.topics : [];

  const parentRefsByUrl = new Map();
  const rawTopicByName = new Map();
  rawTopics.forEach((topic) => {
    const url = normalizeText(topic.url);
    const name = normalizeText(topic.text);
    if (url) {
      const parentRefs = Array.isArray(topic.parent_topic)
        ? topic.parent_topic.map((ref) => normalizeText(ref)).filter(Boolean)
        : [];
      parentRefsByUrl.set(url, parentRefs);
    }
    if (name) {
      rawTopicByName.set(name, topic);
    }
  });

  const topicByUri = new Map();
  const topicByName = new Map();
  topics.forEach((topic) => {
    const uri = normalizeText(topic.uri);
    const name = normalizeText(topic.name);
    if (uri) {
      topicByUri.set(uri, topic);
    }
    if (name && !topicByName.has(name)) {
      topicByName.set(name, topic);
    }
  });

  let touched = 0;
  topics.forEach((topic) => {
    const uri = normalizeText(topic.uri);
    const parentRefs = parentRefsByUrl.get(uri) || [];
    let resolvedParentId = null;
    for (const ref of parentRefs) {
      const parentRaw = rawTopicByName.get(ref);
      let parentTopic = null;
      if ((parentRaw && parentRaw.url)) {
        parentTopic = topicByUri.get(normalizeText(parentRaw.url));
      }
      if (!parentTopic) {
        parentTopic = topicByName.get(ref);
      }
      if (parentTopic && parentTopic.id !== topic.id) {
        resolvedParentId = parentTopic.id;
        break;
      }
    }

    if (resolvedParentId) {
      if (topic.parent_topic_id !== resolvedParentId) {
        topic.parent_topic_id = resolvedParentId;
        touched += 1;
      }
    } else if (topic.parent_topic_id !== null) {
      if (topic.parent_topic_id !== undefined || !Object.prototype.hasOwnProperty.call(topic, "parent_topic_id")) {
        topic.parent_topic_id = null;
        touched += 1;
      }
    } else if (!Object.prototype.hasOwnProperty.call(topic, "parent_topic_id")) {
      topic.parent_topic_id = null;
      touched += 1;
    }
  });

  await writeFile(topicsPath, `${JSON.stringify(topics, null, 2)}\n`, "utf8");
  console.log(`[enrich-parent-topics] updated parent references for ${touched} topics`);
}

main().catch((error) => {
  console.error("[enrich-parent-topics] failed", error);
  process.exit(1);
});
