class Rectangle {
  #height = 0;
  #width;
  constructor(height, width) {
    this.#height = height;
    this.#width = width;
  }
}

const r = new Rectangle();

r.height = 100;

console.log(r);
