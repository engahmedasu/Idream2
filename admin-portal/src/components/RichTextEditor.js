import React, { useMemo, useRef, useEffect, useState } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';

// Import Quill modules for additional features
const Image = Quill.import('formats/image');

// Table support - using custom implementation
// Note: Quill doesn't have native table support, so we'll use HTML insertion

// Custom image handler to support base64 and URLs
class CustomImage extends Image {
  static create(value) {
    const node = super.create(value);
    if (typeof value === 'string') {
      node.setAttribute('src', value);
    }
    return node;
  }
}

Quill.register(CustomImage, true);

const RichTextEditor = ({ value, onChange, placeholder, language = 'en', readOnly = false }) => {
  const quillRef = useRef(null);
  const [showSourceCode, setShowSourceCode] = useState(false);
  const [sourceCode, setSourceCode] = useState('');
  const isRTL = language === 'ar';

  // Configure toolbar with all requested features
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        // Formatting
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'color': [] }, { 'background': [] }],
        ['clean'],
        
        // Layout
        [{ 'align': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'direction': isRTL ? 'rtl' : 'ltr' }],
        ['blockquote']
      ],
      handlers: {}
    },
    clipboard: {
      matchVisual: false
    }
  }), [isRTL]);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'blockquote',
    'clean'
  ];

  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      
      // Set RTL direction
      if (isRTL) {
        quill.format('direction', 'rtl', 'user');
        quill.root.setAttribute('dir', 'rtl');
      } else {
        quill.format('direction', 'ltr', 'user');
        quill.root.setAttribute('dir', 'ltr');
      }

    }
  }, [isRTL]);

  // Handle source code view
  const handleSourceCodeToggle = () => {
    if (showSourceCode) {
      // Apply source code changes
      onChange(sourceCode);
      setShowSourceCode(false);
    } else {
      setSourceCode(value || '');
      setShowSourceCode(true);
    }
  };

  if (showSourceCode) {
    return (
      <div className={`rich-text-editor ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="source-code-header">
          <span>Source Code View</span>
          <div className="source-code-actions">
            <button 
              type="button"
              className="btn-source-code"
              onClick={handleSourceCodeToggle}
            >
              Apply Changes
            </button>
            <button 
              type="button"
              className="btn-source-code btn-cancel"
              onClick={() => setShowSourceCode(false)}
            >
              Cancel
            </button>
          </div>
        </div>
        <textarea
          className="source-code-editor"
          value={sourceCode}
          onChange={(e) => setSourceCode(e.target.value)}
          placeholder="Enter HTML code here..."
          dir={isRTL ? 'rtl' : 'ltr'}
        />
      </div>
    );
  }

  return (
    <div className={`rich-text-editor ${isRTL ? 'rtl' : 'ltr'}`}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{
          direction: isRTL ? 'rtl' : 'ltr'
        }}
      />
      <div className="editor-actions">
        <button
          type="button"
          className="btn-source-code-toggle"
          onClick={handleSourceCodeToggle}
          title="View/Edit Source Code"
        >
          &lt;/&gt; Source Code
        </button>
      </div>
    </div>
  );
};

export default RichTextEditor;

