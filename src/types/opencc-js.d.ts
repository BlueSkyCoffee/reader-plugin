declare module "opencc-js" {
  export interface ConverterOptions {
    from?: "cn" | "tw" | "hk" | "twp" | "jp"
    to?: "cn" | "tw" | "hk" | "twp" | "jp"
  }

  export type Converter = (text: string) => string

  export function Converter(options?: ConverterOptions): Converter
}
