import { Card, CardContent, CardHeader } from './card';
import { cn } from '../../lib/utils';
import { Sparkles, LucideIcon, Target, Video } from 'lucide-react';
import { ReactNode } from 'react';
import { useAppStore } from '../../store';

export function Features() {
    const { language } = useAppStore();

    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-2xl px-6 lg:max-w-5xl">
                <div className="mx-auto grid gap-4 lg:grid-cols-2">
                    <FeatureCard>
                        <CardHeader className="pb-3 text-white">
                            <CardHeading
                                icon={Video}
                                title={language === 'en' ? "Automated Pipeline" : "Pipeline Automatisé"}
                                description={language === 'en' ? "Ingest videos directly from Drive, YouTube, or Fathom. Auto-clip in seconds." : "Ingérez vos vidéos depuis Drive, YouTube ou Fathom. Découpage automatique en quelques secondes."}
                            />
                        </CardHeader>

                        <div className="relative mb-6 border-t border-white/10 border-dashed sm:mb-0">
                            <div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_0%,transparent_40%,rgba(255,255,255,0.05),rgba(255,255,255,0.1)_125%)]"></div>
                            <div className="aspect-[76/59] p-1 px-6">
                                <DualModeImage
                                    darkSrc="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=1207&h=929"
                                    lightSrc="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=1207&h=929"
                                    alt="Video production workflow"
                                    width={1207}
                                    height={929}
                                    className="rounded-xl object-cover"
                                />
                            </div>
                        </div>
                    </FeatureCard>

                    <FeatureCard>
                        <CardHeader className="pb-3 text-white">
                            <CardHeading
                                icon={Sparkles}
                                title={language === 'en' ? "AI Brain" : "Cerveau IA"}
                                description={language === 'en' ? "Let Claude generate your tags, viral hooks, and social media post descriptions." : "Laissez Claude générer vos tags, vos accroches virales et les descriptions de vos posts sociaux."}
                            />
                        </CardHeader>

                        <CardContent>
                            <div className="relative mb-6 sm:mb-0">
                                <div className="absolute -inset-6 [background:radial-gradient(50%_50%_at_75%_50%,transparent,rgba(0,0,0,0.5)_100%)]"></div>
                                <div className="aspect-[76/59] border border-white/10 rounded-xl overflow-hidden">
                                    <DualModeImage
                                        darkSrc="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1207&h=929"
                                        lightSrc="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1207&h=929"
                                        alt="AI generation"
                                        width={1207}
                                        height={929}
                                        className="object-cover h-full w-full opacity-80"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </FeatureCard>

                    <FeatureCard className="p-6 lg:col-span-2 text-white border-white/10">
                        <p className="mx-auto my-6 max-w-md text-balance text-center text-2xl font-semibold">
                            {language === 'en' ? "Centralized Analytics & Strategy" : "Analytiques Centralisées & Stratégie"}
                        </p>

                        <div className="flex justify-center gap-6 overflow-hidden">
                            <CircularUI
                                label={language === 'en' ? "YouTube" : "YouTube"}
                                circles={[{ pattern: 'border' }, { pattern: 'border' }]}
                            />

                            <CircularUI
                                label={language === 'en' ? "TikTok" : "TikTok"}
                                circles={[{ pattern: 'none' }, { pattern: 'primary' }]}
                            />

                            <CircularUI
                                label={language === 'en' ? "Metricool" : "Metricool"}
                                circles={[{ pattern: 'blue' }, { pattern: 'none' }]}
                            />

                            <CircularUI
                                label={language === 'en' ? "Instagram" : "Instagram"}
                                circles={[{ pattern: 'primary' }, { pattern: 'none' }]}
                                className="hidden sm:block"
                            />
                        </div>
                    </FeatureCard>
                </div>
            </div>
        </section>
    );
}

interface FeatureCardProps {
    children: ReactNode;
    className?: string;
}

const FeatureCard = ({ children, className }: FeatureCardProps) => (
    <Card className={cn('group relative rounded-2xl border-white/10 bg-black/40 backdrop-blur-sm shadow-2xl', className)}>
        <CardDecorator />
        {children}
    </Card>
);

const CardDecorator = () => (
    <>
        <span className="border-white/20 absolute -left-px -top-px block size-2 border-l-2 border-t-2"></span>
        <span className="border-white/20 absolute -right-px -top-px block size-2 border-r-2 border-t-2"></span>
        <span className="border-white/20 absolute -bottom-px -left-px block size-2 border-b-2 border-l-2"></span>
        <span className="border-white/20 absolute -bottom-px -right-px block size-2 border-b-2 border-r-2"></span>
    </>
);

interface CardHeadingProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

const CardHeading = ({ icon: Icon, title, description }: CardHeadingProps) => (
    <div className="p-6">
        <span className="text-white/60 flex items-center gap-2 text-sm uppercase tracking-wider font-semibold">
            <Icon className="size-4" />
            {title}
        </span>
        <p className="mt-8 text-2xl font-semibold leading-tight">{description}</p>
    </div>
);

interface DualModeImageProps {
    darkSrc: string;
    lightSrc: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
}

const DualModeImage = ({ darkSrc, lightSrc, alt, width, height, className }: DualModeImageProps) => (
    <>
        <img
            src={darkSrc}
            className={cn('hidden dark:block', className)}
            alt={`${alt} dark`}
            width={width}
            height={height}
        />
        <img
            src={lightSrc}
            className={cn('shadow dark:hidden', className)}
            alt={`${alt} light`}
            width={width}
            height={height}
        />
    </>
);

interface CircleConfig {
    pattern: 'none' | 'border' | 'primary' | 'blue';
}

interface CircularUIProps {
    label: string;
    circles: CircleConfig[];
    className?: string;
}

const CircularUI = ({ label, circles, className }: CircularUIProps) => (
    <div className={className}>
        <div className="bg-gradient-to-b from-white/10 size-fit rounded-2xl to-transparent p-px">
            <div className="bg-gradient-to-b from-black/50 to-white/5 relative flex aspect-square w-fit items-center -space-x-4 rounded-[15px] p-4">
                {circles.map((circle, i) => (
                    <div
                        key={i}
                        className={cn('size-7 rounded-full border border-white/20 sm:size-8', {
                            'border-white/40': circle.pattern === 'none',
                            'border-white/30 bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,0.1),rgba(255,255,255,0.1)_1px,transparent_1px,transparent_4px)]': circle.pattern === 'border',
                            'border-white/50 bg-black/20 bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,0.3),rgba(255,255,255,0.3)_1px,transparent_1px,transparent_4px)]': circle.pattern === 'primary',
                            'bg-black/20 z-1 border-blue-500/50 bg-[repeating-linear-gradient(-45deg,rgba(59,130,246,0.5),rgba(59,130,246,0.5)_1px,transparent_1px,transparent_4px)]': circle.pattern === 'blue',
                        })}></div>
                ))}
            </div>
        </div>
        <span className="text-white/60 mt-1.5 block text-center text-sm">{label}</span>
    </div>
);
