import { get_encoding } from "tiktoken"

const encoderForGpt2 = get_encoding("gpt2")

const encoded = encoderForGpt2.encode("Hello, how are you?")

console.log(encoded)

const decoder = encoderForGpt2.decode(encoded)

console.log(new TextDecoder().decode(decoder))



