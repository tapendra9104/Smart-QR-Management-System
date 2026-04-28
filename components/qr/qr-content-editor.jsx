"use client";
import { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
    Link, Type, User, Wifi, Mail,
    MessageSquare, Phone, MessageCircle,
} from "lucide-react";

const CONTENT_TYPES = [
    { value: "url", label: "URL", icon: Link, description: "Website link" },
    { value: "text", label: "Text", icon: Type, description: "Plain text" },
    { value: "vcard", label: "vCard", icon: User, description: "Contact card" },
    { value: "wifi", label: "WiFi", icon: Wifi, description: "WiFi network" },
    { value: "email", label: "Email", icon: Mail, description: "Email address" },
    { value: "sms", label: "SMS", icon: MessageSquare, description: "Text message" },
    { value: "phone", label: "Phone", icon: Phone, description: "Phone call" },
    { value: "whatsapp", label: "WhatsApp", icon: MessageCircle, description: "WhatsApp message" },
];

export function QRContentEditor({ contentType, onContentTypeChange, content, onContentChange }) {
    const [vcard, setVcard] = useState({
        firstName: "", lastName: "", phone: "", email: "",
        company: "", title: "", website: "",
    });
    const [wifi, setWifi] = useState({
        ssid: "", password: "", encryption: "WPA", hidden: false,
    });
    const [email, setEmail] = useState({ to: "", subject: "", body: "" });
    const [sms, setSms] = useState({ phone: "", message: "" });
    const [phoneNum, setPhoneNum] = useState("");
    const [whatsapp, setWhatsapp] = useState({ phone: "", message: "" });

    const generateVCardContent = useCallback((data) => {
        return `BEGIN:VCARD\nVERSION:3.0\nN:${data.lastName};${data.firstName}\nFN:${data.firstName} ${data.lastName}\nTEL:${data.phone}\nEMAIL:${data.email}\nORG:${data.company}\nTITLE:${data.title}\nURL:${data.website}\nEND:VCARD`;
    }, []);

    const generateWifiContent = useCallback((data) => {
        return `WIFI:T:${data.encryption};S:${data.ssid};P:${data.password};H:${data.hidden ? "true" : "false"};;`;
    }, []);

    const generateEmailContent = useCallback((data) => {
        return `mailto:${data.to}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.body)}`;
    }, []);

    const generateSmsContent = useCallback((data) => {
        return `smsto:${data.phone}:${data.message}`;
    }, []);

    const generateWhatsappContent = useCallback((data) => {
        const num = data.phone.replace(/[^0-9]/g, "");
        return `https://wa.me/${num}?text=${encodeURIComponent(data.message)}`;
    }, []);

    const handleVcardChange = (field, value) => {
        const newVcard = { ...vcard, [field]: value };
        setVcard(newVcard);
        onContentChange(generateVCardContent(newVcard));
    };

    const handleWifiChange = (field, value) => {
        const newWifi = { ...wifi, [field]: value };
        setWifi(newWifi);
        onContentChange(generateWifiContent(newWifi));
    };

    const handleEmailChange = (field, value) => {
        const newEmail = { ...email, [field]: value };
        setEmail(newEmail);
        onContentChange(generateEmailContent(newEmail));
    };

    const handleSmsChange = (field, value) => {
        const newSms = { ...sms, [field]: value };
        setSms(newSms);
        onContentChange(generateSmsContent(newSms));
    };

    const handlePhoneChange = (value) => {
        setPhoneNum(value);
        onContentChange(`tel:${value}`);
    };

    const handleWhatsappChange = (field, value) => {
        const newWhatsapp = { ...whatsapp, [field]: value };
        setWhatsapp(newWhatsapp);
        onContentChange(generateWhatsappContent(newWhatsapp));
    };

    return (
        <div className="space-y-4">
            {/* Type Selector — Icon Grid */}
            <div className="grid grid-cols-4 gap-2">
                {CONTENT_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isActive = contentType === type.value;
                    return (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => onContentTypeChange(type.value)}
                            className={cn(
                                "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-xs font-medium transition-all",
                                isActive
                                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                                    : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {type.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Form */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    {/* URL */}
                    {contentType === "url" && (
                        <div className="space-y-2">
                            <Label htmlFor="url">Website URL</Label>
                            <Input id="url" type="url" placeholder="https://example.com" value={content} onChange={(e) => onContentChange(e.target.value)} />
                            <p className="text-xs text-muted-foreground">Enter the full URL including https://</p>
                        </div>
                    )}

                    {/* Text */}
                    {contentType === "text" && (
                        <div className="space-y-2">
                            <Label htmlFor="text">Text Content</Label>
                            <Textarea id="text" placeholder="Enter any text..." rows={4} value={content} onChange={(e) => onContentChange(e.target.value)} />
                            <p className="text-xs text-muted-foreground">{content.length} characters</p>
                        </div>
                    )}

                    {/* vCard */}
                    {contentType === "vcard" && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input id="firstName" placeholder="John" value={vcard.firstName} onChange={(e) => handleVcardChange("firstName", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input id="lastName" placeholder="Doe" value={vcard.lastName} onChange={(e) => handleVcardChange("lastName", e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" value={vcard.phone} onChange={(e) => handleVcardChange("phone", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vcardEmail">Email</Label>
                                <Input id="vcardEmail" type="email" placeholder="john@example.com" value={vcard.email} onChange={(e) => handleVcardChange("email", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="company">Company</Label>
                                    <Input id="company" placeholder="Acme Inc." value={vcard.company} onChange={(e) => handleVcardChange("company", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="title">Job Title</Label>
                                    <Input id="title" placeholder="Software Engineer" value={vcard.title} onChange={(e) => handleVcardChange("title", e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input id="website" type="url" placeholder="https://johndoe.com" value={vcard.website} onChange={(e) => handleVcardChange("website", e.target.value)} />
                            </div>
                        </>
                    )}

                    {/* WiFi */}
                    {contentType === "wifi" && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="ssid">Network Name (SSID)</Label>
                                <Input id="ssid" placeholder="MyWiFiNetwork" value={wifi.ssid} onChange={(e) => handleWifiChange("ssid", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="wifiPassword">Password</Label>
                                <Input id="wifiPassword" type="password" placeholder="Enter password" value={wifi.password} onChange={(e) => handleWifiChange("password", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="encryption">Security Type</Label>
                                <Select value={wifi.encryption} onValueChange={(value) => handleWifiChange("encryption", value)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WPA">WPA/WPA2</SelectItem>
                                        <SelectItem value="WEP">WEP</SelectItem>
                                        <SelectItem value="nopass">No Password</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="hidden" className="text-sm">Hidden Network</Label>
                                <Switch id="hidden" checked={wifi.hidden} onCheckedChange={(checked) => handleWifiChange("hidden", checked)} />
                            </div>
                        </>
                    )}

                    {/* Email */}
                    {contentType === "email" && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="emailTo">To Email</Label>
                                <Input id="emailTo" type="email" placeholder="recipient@example.com" value={email.to} onChange={(e) => handleEmailChange("to", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input id="subject" placeholder="Email subject" value={email.subject} onChange={(e) => handleEmailChange("subject", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="body">Message</Label>
                                <Textarea id="body" placeholder="Email body..." rows={3} value={email.body} onChange={(e) => handleEmailChange("body", e.target.value)} />
                            </div>
                        </>
                    )}

                    {/* SMS */}
                    {contentType === "sms" && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="smsPhone">Phone Number</Label>
                                <Input id="smsPhone" type="tel" placeholder="+1 (555) 123-4567" value={sms.phone} onChange={(e) => handleSmsChange("phone", e.target.value)} />
                                <p className="text-xs text-muted-foreground">Include country code for international numbers</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="smsMessage">Pre-filled Message</Label>
                                <Textarea id="smsMessage" placeholder="Your message here..." rows={3} value={sms.message} onChange={(e) => handleSmsChange("message", e.target.value)} />
                                <p className="text-xs text-muted-foreground">{sms.message.length}/160 characters</p>
                            </div>
                        </>
                    )}

                    {/* Phone */}
                    {contentType === "phone" && (
                        <div className="space-y-2">
                            <Label htmlFor="callPhone">Phone Number</Label>
                            <Input id="callPhone" type="tel" placeholder="+1 (555) 123-4567" value={phoneNum} onChange={(e) => handlePhoneChange(e.target.value)} />
                            <p className="text-xs text-muted-foreground">Scanning will open the phone dialer with this number</p>
                        </div>
                    )}

                    {/* WhatsApp */}
                    {contentType === "whatsapp" && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="waPhone">WhatsApp Number</Label>
                                <Input id="waPhone" type="tel" placeholder="+1 555 123 4567" value={whatsapp.phone} onChange={(e) => handleWhatsappChange("phone", e.target.value)} />
                                <p className="text-xs text-muted-foreground">Include country code without + sign (e.g., 14155551234)</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="waMessage">Pre-filled Message</Label>
                                <Textarea id="waMessage" placeholder="Hello! I scanned your QR code..." rows={3} value={whatsapp.message} onChange={(e) => handleWhatsappChange("message", e.target.value)} />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
