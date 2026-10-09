"use client";

import { FC, KeyboardEvent, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  ToggleButton,
  Tooltip,
} from "@mui/material";
import FormatBold from "@mui/icons-material/FormatBold";
import FormatItalic from "@mui/icons-material/FormatItalic";
import FormatUnderlined from "@mui/icons-material/FormatUnderlined";
import StrikethroughS from "@mui/icons-material/StrikethroughS";
import Code from "@mui/icons-material/Code";
import FormatListBulleted from "@mui/icons-material/FormatListBulleted";
import FormatListNumbered from "@mui/icons-material/FormatListNumbered";
import FormatQuote from "@mui/icons-material/FormatQuote";
import DataObject from "@mui/icons-material/DataObject";
import InsertLink from "@mui/icons-material/InsertLink";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface RichTextEditorProps {
  /** The initial HTML. Later changes to it are ignored: the editor owns the text while it is open. */
  value: string;
  onChange: (html: string) => void;
  /** The id of the visible label. */
  labelId: string;
  describedBy?: string;
  invalid?: boolean;
}

const HTTP_URL = /^https?:\/\/\S+$/i;

/**
 * The description editor (Tiptap). It offers exactly what the API keeps
 * (docs/m4-plan.md §1 and the API's §4.1): H2-H4, bold, italic, underline,
 * strike, code, lists, quote, code block and http(s) links. No image, no table.
 * It is not the security boundary: the API sanitizes on write and the page
 * sanitizes on render.
 */
const RichTextEditor: FC<RichTextEditorProps> = ({
  value,
  onChange,
  labelId,
  describedBy,
  invalid,
}) => {
  const { t } = useLanguage();
  const text = t.projects.form;
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const toolbarRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: false,
          linkOnPaste: false,
          // The API sets rel and target on every link it keeps.
          HTMLAttributes: { target: null, rel: null },
          isAllowedUri: (url) => HTTP_URL.test(url),
        },
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": labelId,
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(invalid ? { "aria-invalid": "true" } : {}),
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? "" : e.getHTML()),
  });

  if (!editor) return null;

  type Item = {
    key: string;
    label: string;
    icon: React.ReactNode;
    active: boolean;
    run: () => void;
  };
  const chain = (e: Editor) => e.chain().focus();
  const items: (Item | "sep")[] = [
    {
      key: "bold",
      label: text.bold,
      icon: <FormatBold />,
      active: editor.isActive("bold"),
      run: () => chain(editor).toggleBold().run(),
    },
    {
      key: "italic",
      label: text.italic,
      icon: <FormatItalic />,
      active: editor.isActive("italic"),
      run: () => chain(editor).toggleItalic().run(),
    },
    {
      key: "underline",
      label: text.underline,
      icon: <FormatUnderlined />,
      active: editor.isActive("underline"),
      run: () => chain(editor).toggleUnderline().run(),
    },
    {
      key: "strike",
      label: text.strike,
      icon: <StrikethroughS />,
      active: editor.isActive("strike"),
      run: () => chain(editor).toggleStrike().run(),
    },
    {
      key: "code",
      label: text.code,
      icon: <Code />,
      active: editor.isActive("code"),
      run: () => chain(editor).toggleCode().run(),
    },
    "sep",
    {
      key: "h2",
      label: text.heading2,
      icon: <b>H2</b>,
      active: editor.isActive("heading", { level: 2 }),
      run: () => chain(editor).toggleHeading({ level: 2 }).run(),
    },
    {
      key: "h3",
      label: text.heading3,
      icon: <b>H3</b>,
      active: editor.isActive("heading", { level: 3 }),
      run: () => chain(editor).toggleHeading({ level: 3 }).run(),
    },
    {
      key: "h4",
      label: text.heading4,
      icon: <b>H4</b>,
      active: editor.isActive("heading", { level: 4 }),
      run: () => chain(editor).toggleHeading({ level: 4 }).run(),
    },
    "sep",
    {
      key: "ul",
      label: text.bulletList,
      icon: <FormatListBulleted />,
      active: editor.isActive("bulletList"),
      run: () => chain(editor).toggleBulletList().run(),
    },
    {
      key: "ol",
      label: text.orderedList,
      icon: <FormatListNumbered />,
      active: editor.isActive("orderedList"),
      run: () => chain(editor).toggleOrderedList().run(),
    },
    {
      key: "quote",
      label: text.quote,
      icon: <FormatQuote />,
      active: editor.isActive("blockquote"),
      run: () => chain(editor).toggleBlockquote().run(),
    },
    {
      key: "codeBlock",
      label: text.codeBlock,
      icon: <DataObject />,
      active: editor.isActive("codeBlock"),
      run: () => chain(editor).toggleCodeBlock().run(),
    },
    "sep",
    {
      key: "link",
      label: text.link,
      icon: <InsertLink />,
      active: editor.isActive("link"),
      run: () => {
        setLinkUrl((editor.getAttributes("link").href as string | undefined) ?? "");
        setLinkOpen(true);
      },
    },
  ];

  /** One tab stop for the toolbar; the arrow keys move inside it. */
  const onToolbarKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const buttons = [...(toolbarRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    const move: Record<string, number> = {
      ArrowRight: (at + 1) % buttons.length,
      ArrowLeft: (at - 1 + buttons.length) % buttons.length,
      Home: 0,
      End: buttons.length - 1,
    };
    const next = move[event.key];
    if (next === undefined) return;
    event.preventDefault();
    buttons.forEach((b, i) => (b.tabIndex = i === next ? 0 : -1));
    buttons[next]?.focus();
  };

  const applyLink = () => {
    const url = linkUrl.trim();
    if (url === "") editor.chain().focus().unsetLink().run();
    else if (HTTP_URL.test(url))
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    else return;
    setLinkOpen(false);
  };
  const linkInvalid = linkUrl.trim() !== "" && !HTTP_URL.test(linkUrl.trim());

  return (
    <Box
      sx={(theme) => ({
        border: 1,
        borderColor: invalid ? "error.main" : theme.palette.surface.line,
        borderRadius: 3,
        overflow: "hidden",
        "&:focus-within": { outline: `3px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
      })}
    >
      <Box
        ref={toolbarRef}
        role="toolbar"
        aria-label={text.toolbar}
        aria-controls={undefined}
        onKeyDown={onToolbarKey}
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 0.5,
          p: 0.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {items.map((item, i) =>
          item === "sep" ? (
            <Divider key={`s${i}`} orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          ) : (
            <Tooltip key={item.key} title={item.label}>
              <ToggleButton
                value={item.key}
                size="small"
                selected={item.active}
                aria-label={item.label}
                aria-pressed={item.active}
                tabIndex={i === 0 ? 0 : -1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={item.run}
                sx={{ border: 0, minWidth: 44, minHeight: 44, borderRadius: 2 }}
              >
                {item.icon}
              </ToggleButton>
            </Tooltip>
          ),
        )}
      </Box>
      <EditorContent editor={editor} style={{ minHeight: 200 }} />
      <style>{`
        .tiptap { min-height: 200px; padding: 12px 16px; outline: none; overflow-wrap: anywhere; }
        .tiptap > :first-child { margin-top: 0; }
        .tiptap p { margin: 0 0 12px; }
        .tiptap h2, .tiptap h3, .tiptap h4 { margin: 16px 0 8px; }
        .tiptap ul, .tiptap ol { padding-left: 24px; }
        .tiptap blockquote { margin: 0 0 12px; padding-left: 12px; border-left: 3px solid currentColor; opacity: 0.85; }
        .tiptap pre { padding: 12px; border-radius: 8px; overflow-x: auto; background: rgba(127,127,127,.15); }
        .tiptap code { font-family: ui-monospace, monospace; }
        .tiptap a { text-decoration: underline; }
      `}</style>
      <Dialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        fullWidth
        maxWidth="xs"
        aria-labelledby="link-dialog-title"
      >
        <DialogTitle id="link-dialog-title">{text.linkDialogTitle}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            type="url"
            label={text.linkUrl}
            placeholder="https://"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
            }}
            error={linkInvalid}
            helperText={linkInvalid ? t.projects.form.errorHttps : undefined}
          />
        </DialogContent>
        <DialogActions>
          {editor.isActive("link") && (
            <Button
              color="error"
              onClick={() => {
                editor.chain().focus().unsetLink().run();
                setLinkOpen(false);
              }}
            >
              {text.linkRemove}
            </Button>
          )}
          <Button onClick={() => setLinkOpen(false)}>{text.cancel}</Button>
          <Button variant="contained" onClick={applyLink} disabled={linkInvalid}>
            {text.linkApply}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RichTextEditor;
