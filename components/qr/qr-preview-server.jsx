"use client";
import { QRPreview } from "./qr-preview";
import { DEFAULT_QR_STYLE } from "@/lib/types/qr";
export function QRPreviewServer({ code }) {
    const style = code.style || DEFAULT_QR_STYLE;
    return (<QRPreview content={code.qr_payload || code.content} style={style} name={code.name}/>);
}
