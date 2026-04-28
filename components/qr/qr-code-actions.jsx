"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Download, Edit, Trash2, ExternalLink, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { clientApi } from "@/lib/api/client";
export function QRCodeActions({ code }) {
    const router = useRouter();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const handleDelete = async () => {
        setDeleting(true);
        try {
            await clientApi(`/qr-codes/${code.id}`, { method: "DELETE" });
            toast.success("QR code deleted successfully");
            router.refresh();
        }
        catch {
            toast.error("Failed to delete QR code");
        }
        finally {
            setDeleting(false);
            setDeleteOpen(false);
        }
    };
    return (<>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4"/>
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/codes/${code.id}`}>
              <ExternalLink className="mr-2 h-4 w-4"/>
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/codes/${code.id}/analytics`}>
              <BarChart3 className="mr-2 h-4 w-4"/>
              Analytics
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/codes/${code.id}/edit`}>
              <Edit className="mr-2 h-4 w-4"/>
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/codes/${code.id}`}>
              <Download className="mr-2 h-4 w-4"/>
              Download
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4"/>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete QR Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{code.name}&quot;? This action cannot be undone and all scan data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>);
}
