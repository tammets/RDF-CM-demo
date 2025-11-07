import type { Topic } from "@/api/curriculumClient";

export type TopicTreeNode = {
  topic: Topic;
  children: TopicTreeNode[];
};

function getTopicOrder(topic: Topic) {
  if (typeof topic.order_index === "number") {
    return topic.order_index;
  }
  return Number.MAX_SAFE_INTEGER;
}

export function compareTopics(a: Topic, b: Topic) {
  const orderDiff = getTopicOrder(a) - getTopicOrder(b);
  if (orderDiff !== 0) {
    return orderDiff;
  }
  return b.created_at - a.created_at;
}

export function sortTopics(topics: Topic[]) {
  return [...topics].sort(compareTopics);
}

export function buildTopicTree(topics: Topic[]): TopicTreeNode[] {
  const nodes = new Map<string, TopicTreeNode>();
  topics.forEach((topic) => {
    nodes.set(topic.id, { topic, children: [] });
  });

  const roots: TopicTreeNode[] = [];
  nodes.forEach((node) => {
    const parentId = node.topic.parent_topic_id ?? undefined;
    if (parentId && nodes.has(parentId)) {
      nodes.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodeList = (list: TopicTreeNode[]) => {
    list.sort((a, b) => compareTopics(a.topic, b.topic));
    list.forEach((node) => sortNodeList(node.children));
  };

  sortNodeList(roots);
  return roots;
}

export function buildTopicTreeBySubject(topics: Topic[]) {
  const grouped: Record<string, Topic[]> = {};
  topics.forEach((topic) => {
    if (!grouped[topic.subject_id]) {
      grouped[topic.subject_id] = [];
    }
    grouped[topic.subject_id].push(topic);
  });

  const treeBySubject: Record<string, TopicTreeNode[]> = {};
  Object.entries(grouped).forEach(([subjectId, subjectTopics]) => {
    treeBySubject[subjectId] = buildTopicTree(subjectTopics);
  });
  return treeBySubject;
}

export function flattenTopicTree(nodes: TopicTreeNode[], depth = 0): Array<{ topic: Topic; depth: number }> {
  const result: Array<{ topic: Topic; depth: number }> = [];
  nodes.forEach((node) => {
    result.push({ topic: node.topic, depth });
    result.push(...flattenTopicTree(node.children, depth + 1));
  });
  return result;
}

export function collectTopicDescendants(topics: Topic[], topicId: string) {
  const childMap = new Map<string, Topic[]>();
  topics.forEach((topic) => {
    const parentId = topic.parent_topic_id ?? undefined;
    if (!parentId) {
      return;
    }
    if (!childMap.has(parentId)) {
      childMap.set(parentId, []);
    }
    childMap.get(parentId)!.push(topic);
  });

  const descendants = new Set<string>();
  const queue = [...(childMap.get(topicId) ?? [])];
  while (queue.length) {
    const current = queue.shift()!;
    descendants.add(current.id);
    const children = childMap.get(current.id);
    if (children?.length) {
      queue.push(...children);
    }
  }
  return descendants;
}
