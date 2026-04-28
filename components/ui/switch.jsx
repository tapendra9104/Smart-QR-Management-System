'use client';
import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

function Switch({ className, ...props }) {
    return (
        <SwitchPrimitive.Root
            data-slot="switch"
            className={cn(
                // Size — bigger, thumb fits properly
                'peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent',
                // Off state
                'data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/60',
                // On state — gradient brand colors
                'data-[state=checked]:bg-primary',
                // Transitions
                'transition-all duration-200 ease-in-out',
                // Focus ring
                'outline-none focus-visible:ring-4 focus-visible:ring-ring/30',
                // Disabled
                'disabled:cursor-not-allowed disabled:opacity-50',
                // Glow when checked
                'data-[state=checked]:shadow-[0_0_10px_0px_hsl(var(--primary)/0.35)]',
                className
            )}
            {...props}
        >
            <SwitchPrimitive.Thumb
                data-slot="switch-thumb"
                className={cn(
                    // Size of the thumb
                    'pointer-events-none block size-[18px] rounded-full',
                    // White thumb always
                    'bg-white',
                    // Shadow for depth
                    'shadow-md ring-0',
                    // Slide animation
                    'transition-transform duration-200 ease-in-out',
                    'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
                )}
            />
        </SwitchPrimitive.Root>
    );
}

export { Switch };
