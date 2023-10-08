export class CircularQueue {

  #capacity;
  #queue;
  #front;
  #rear;
  #size;

  constructor(capacity) {

    this.#capacity = capacity;
    this.#queue = new Array(capacity);
    this.#front = -1;
    this.#rear = -1;
    this.#size = 0;

  }

  // Enqueue an element
  enqueue(item) {

    if (this.isFull()) {
      this.dequeue();
    }

    if (this.isEmpty()) {
      this.#front = this.#rear = 0;
    } else {
      this.#rear = (this.#rear + 1) % this.#capacity;
    }

    this.#queue[this.#rear] = item;
    this.#size++;

  }

  // Dequeue an element
  dequeue() {

    if (this.isEmpty()) {
      console.error('Queue is empty. Cannot dequeue.');
      return;
    }

    const removedItem = this.#queue[this.#front];
    this.#queue[this.#front] = undefined;

    if (this.#front === this.#rear) {
      this.#front = this.#rear = -1;
    } else {
      this.#front = (this.#front + 1) % this.#capacity;
    }

    this.#size--;

    return removedItem;

  }

  // Check if the queue is empty
  isEmpty() {

    return this.#size === 0;

  }

  // Check if the queue is full
  isFull() {

    return this.#size === this.#capacity;

  }

  // Get the front element without dequeuing it
  peek() {

    if (this.isEmpty()) {
      console.error('Queue is empty. Cannot peek.');
      return;
    }

    return this.#queue[this.#front];

  }

  // Get the size of the queue
  getSize() {

    return this.#size;

  }

  getClonedArray() {

    if (this.isEmpty()) {

      console.log('Queue is empty.');

      return [];

    }

    let current = this.#front;
    const elements = [];

    while (current !== this.#rear) {
      elements.push(this.#queue[current]);
      current = (current + 1) % this.#capacity;
    }

    elements.push(this.#queue[current]);

    return structuredClone(elements);

  }

  // Print the queue elements
  print() {

    const elements = this.getClonedArray();

    console.log('CircularQueue:', elements.join(' -> '));

  }

  toJSON() {

    const clonedArr = this.getClonedArray();

    // console.log('CircularQueue#toJSON');
    // console.log(clonedArr);

    return clonedArr;

  }

  toString() {

    return JSON.stringify(this.getClonedArray());

  }

  serialize() {

    return this.toString();

  }

  deserialize(stringData) {

    try {

      const dataArr = JSON.parse(stringData);

      // console.log('CircularQueue#deserialize');
      // console.log(dataArr);

      if (Array.isArray(dataArr)) {

        dataArr.forEach(item => this.enqueue(item));

      }

    } catch (err) {

      console.log(`Deserialization error: ${err}`);

    }

  }

}
