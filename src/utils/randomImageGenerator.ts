import { createCanvas, Canvas } from "canvas";
import randomColor from "randomcolor";

class RandomImageGenerator {
  constructor() {}

  async generate(name: string): Promise<Buffer> {
    const canvas: Canvas = createCanvas(100, 100);
    const ctx = canvas.getContext("2d");

    // Generate a random background color
    const backgroundColor: string = randomColor();

    // Set the background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set the text properties
    ctx.font = "36px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Get the first letter of the username
    const firstLetter: string = name.charAt(0).toUpperCase();

    // Calculate the position to center the text
    const x: number = canvas.width / 2;
    const y: number = canvas.height / 2;

    // Draw the first letter on the canvas
    ctx.fillText(firstLetter, x, y);

    // Convert the canvas to a Buffer
    const buffer: Buffer = canvas.toBuffer("image/png");

    return buffer;
  }
}

export default RandomImageGenerator;
