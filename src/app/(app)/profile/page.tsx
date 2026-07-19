import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Bookmark, CalendarHeart, Database, Heart, Images,
  LogOut, MapPin, Plane, User,
} from "lucide-react";
import { getCurrentProfile } from "@/services/profiles";
import { getProfileStats } from "@/services/stats";
import { daysSince, formatBytes, formatDate } from "@/lib/format";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { signOut, updateTogetherSince } from "./actions";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const [profile, stats] = await Promise.all([getCurrentProfile(), getProfileStats()]);
  if (!profile) return null; // unreachable behind middleware

  return (
    <div className="pt-8 md:pt-12">
      <h1 className="chapter-heading text-3xl text-ink">Profile</h1>

      {/* Account */}
      <section aria-label="Account" className="mt-6 flex items-center gap-4 rounded-xl bg-card p-5 shadow-soft">
        {profile.avatarUrl ? (
          <Image src={profile.avatarUrl} alt="" width={56} height={56} className="size-14 rounded-full object-cover" />
        ) : (
          <div className="flex size-14 items-center justify-center rounded-full bg-sand">
            <User className="size-6 text-rose" aria-hidden />
          </div>
        )}
        <div className="min-w-0">
          <p className="display truncate text-lg text-ink">{profile.displayName || "Unnamed"}</p>
          <p className="truncate text-sm text-stone">{profile.email}</p>
        </div>
      </section>

      {/* Together since */}
      <section aria-label="Together since" className="mt-4 rounded-xl bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <CalendarHeart className="size-4 text-rose" aria-hidden />
          Together since
        </div>
        {profile.togetherSince ? (
          <p className="mt-2 text-[15px] text-ink">
            {formatDate(profile.togetherSince)} —{" "}
            <span className="display text-rose-deep">{daysSince(profile.togetherSince)} days</span>{" "}
            and counting
          </p>
        ) : (
          <p className="mt-2 text-sm text-stone">Set a date to start counting the days.</p>
        )}
        <form action={updateTogetherSince} className="mt-3 flex items-center gap-2">
          <label htmlFor="together_since" className="sr-only">Together since date</label>
          <input
            id="together_since"
            name="together_since"
            type="date"
            defaultValue={profile.togetherSince ?? ""}
            className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-ink outline-none focus:border-rose"
          />
          <button
            type="submit"
            className="h-11 rounded-full bg-sand px-4 text-sm font-medium text-ink transition-transform active:scale-[0.97]"
          >
            Save
          </button>
        </form>
      </section>

      {/* Statistics */}
      <section aria-label="Statistics" className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard icon={Images} value={String(stats.albums)} label="Albums" />
        <StatCard icon={Images} value={String(stats.photos)} label="Photos" />
        <StatCard icon={Plane} value={String(stats.trips)} label="Trips" />
        <StatCard icon={MapPin} value={String(stats.places)} label="Places" />
        <StatCard icon={Heart} value={String(stats.favoritePhotos)} label="Favorite photos" />
        <StatCard icon={Database} value={formatBytes(stats.storageBytes)} label="Storage used" />
      </section>

      {stats.favoriteMemory && (
        <Link
          href={`/albums/${stats.favoriteMemory.id}`}
          className="mt-4 flex items-center gap-3 rounded-xl bg-blush p-5 shadow-soft transition-shadow hover:shadow-lifted"
        >
          <Bookmark className="size-5 shrink-0 text-rose-deep" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-rose-deep/80">
              Favorite memory
            </p>
            <p className="display truncate text-lg text-rose-deep">{stats.favoriteMemory.title}</p>
          </div>
        </Link>
      )}

      {/* Settings */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <ThemeToggle />
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-[15px] font-medium text-destructive shadow-soft transition-transform duration-200 active:scale-[0.98]"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof User;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-card p-4 shadow-soft">
      <Icon className="size-[18px] text-rose" aria-hidden />
      <p className="display mt-2 text-2xl text-ink">{value}</p>
      <p className="text-xs text-stone">{label}</p>
    </div>
  );
}
