"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Loader2,
  Moon,
  MoreHorizontalIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  PlusIcon,
  Sun,
  Trash2Icon,
} from "lucide-react";
import CustomUserButton from "@/components/ui/customUserButton";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useUpdateConversation,
} from "@/features/conversation/hooks/use-conversation";
import { cn } from "@/lib/utils";

type Conversation = NonNullable<
  ReturnType<typeof useConversations>["data"]
>[number];

/**
 * Main application sidebar — logo, new chat, conversation list with pinned/recent grouping,
 * theme toggle, and account menu.
 */
export function AppSidebar() {
  const pathname = usePathname();
  const { data: conversations, isLoading } = useConversations();
  const createConversation = useCreateConversation();

  // Extract active conversation id from /c/[id]
  const activeId = pathname.startsWith("/c/")
    ? pathname.split("/")[2]
    : undefined;

  const pinned = conversations?.filter((c) => c.isPinned) ?? [];
  const recent = conversations?.filter((c) => !c.isPinned) ?? [];

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="font-semibold tracking-tight"
              render={<Link href="/" prefetch={false} />}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-xs">
                C
              </span>
              <span className="font-bold text-base">ChaiGPT</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="New chat"
              onClick={() => createConversation.mutate(undefined)}
              disabled={createConversation.isPending}
              className="font-medium"
            >
              {createConversation.isPending ? (
                <Loader2 className="size-4 animate-spin shrink-0" />
              ) : (
                <PlusIcon className="size-4 shrink-0" />
              )}
              <span>New chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {isLoading ? (
          <SidebarGroup>
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.from({ length: 5 }).map((_, index) => (
                  <SidebarMenuItem key={index}>
                    <Skeleton className="h-8 w-full rounded-md" />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : !conversations?.length ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <p className="px-3 py-2 text-xs text-muted-foreground">No chats yet</p>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            {/* Pinned section (only shown if pinned chats exist) */}
            {pinned.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <PinIcon className="size-3" />
                  <span>Pinned</span>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {pinned.map((conversation) => (
                      <ChatItem
                        key={conversation.id}
                        conversation={conversation}
                        isActive={activeId === conversation.id}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Recent section */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground">
                {pinned.length > 0 ? "Recent" : "Chats"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {recent.map((conversation) => (
                    <ChatItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={activeId === conversation.id}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarFooterMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

/** Single sidebar row for a conversation with rename, pin, and delete actions. */
function ChatItem({
  conversation,
  isActive,
}: {
  conversation: Conversation;
  isActive: boolean;
}) {
  const updateConversation = useUpdateConversation();
  const deleteConversation = useDeleteConversation();

  /** Prompts the user to rename the conversation and persists the new title. */
  function handleRename() {
    const next = window.prompt("Rename chat", conversation.title);
    if (!next || next.trim() === conversation.title) return;
    updateConversation.mutate({
      conversationId: conversation.id,
      data: { title: next.trim() },
    });
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={conversation.title}
        render={<Link href={`/c/${conversation.id}`} />}
        className={cn(
          "group/chat-item relative pr-7",
          isActive && "font-medium bg-sidebar-accent text-sidebar-accent-foreground"
        )}
      >
        {conversation.isPinned && (
          <PinIcon className="size-3 text-muted-foreground/70 shrink-0 mr-1" />
        )}
        <span className="truncate">{conversation.title}</span>
      </SidebarMenuButton>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuAction
              showOnHover
              className="data-popup-open:bg-sidebar-accent"
            />
          }
        >
          <MoreHorizontalIcon className="size-3.5" />
          <span className="sr-only">Chat actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem onClick={handleRename}>
            <PencilIcon className="size-3.5 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              updateConversation.mutate({
                conversationId: conversation.id,
                data: { isPinned: !conversation.isPinned },
              })
            }
          >
            {conversation.isPinned ? (
              <PinOffIcon className="size-3.5 mr-2" />
            ) : (
              <PinIcon className="size-3.5 mr-2" />
            )}
            {conversation.isPinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => deleteConversation.mutate(conversation.id)}
          >
            <Trash2Icon className="size-3.5 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

/** Footer menu with theme toggle and Clerk user account button. */
function SidebarFooterMenu() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={resolvedTheme === "dark" ? "Light theme" : "Dark theme"}
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="size-4 shrink-0" />
          ) : (
            <Moon className="size-4 shrink-0" />
          )}
          <span>{resolvedTheme === "dark" ? "Light theme" : "Dark theme"}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <div className="flex items-center gap-2 px-1 py-1 overflow-hidden group-data-[collapsible=icon]:justify-center">
          <CustomUserButton />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}