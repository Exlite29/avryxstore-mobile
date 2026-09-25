import { useCallback, useEffect, useRef } from 'react';

const MIN_SCAN_LENGTH = 4;
const MIN_SCAN_EVENTS = 3;
const MAX_SCAN_LENGTH = 128;
const MAX_KEY_GAP_MS = 120;
const MAX_SCAN_DURATION_MS = 2000;
const SCAN_TIMEOUT_MS = 250;

type SetValue = (value: string) => void;
type Selection = { start: number; end: number };

type ScanCapture = {
  field: string;
  baseValue: string;
  lastValue: string;
  value: string;
  setValue: SetValue;
  startedAt: number;
  lastKeyAt: number;
  hasTerminator: boolean;
  eventCount: number;
  timer: ReturnType<typeof setTimeout> | null;
};

type CaptureResult = {
  value: string;
  accepted: boolean;
};

function getInsertedText(
  previousValue: string,
  nextValue: string,
  selection?: Selection
): { text: string; usedSelection: boolean } {
  if (previousValue === nextValue) {
    return { text: '', usedSelection: false };
  }

  if (
    selection &&
    selection.start >= 0 &&
    selection.end >= selection.start &&
    selection.end <= previousValue.length
  ) {
    const prefix = previousValue.slice(0, selection.start);
    const suffix = previousValue.slice(selection.end);
    if (nextValue.startsWith(prefix) && nextValue.endsWith(suffix)) {
      return {
        text: nextValue.slice(selection.start, nextValue.length - suffix.length),
        usedSelection: true
      };
    }
  }

  let prefixLength = 0;
  while (
    prefixLength < previousValue.length &&
    prefixLength < nextValue.length &&
    previousValue[prefixLength] === nextValue[prefixLength]
  ) {
    prefixLength += 1;
  }

  let suffixLength = 0;
  while (
    suffixLength < previousValue.length - prefixLength &&
    suffixLength < nextValue.length - prefixLength &&
    previousValue[previousValue.length - 1 - suffixLength] === nextValue[nextValue.length - 1 - suffixLength]
  ) {
    suffixLength += 1;
  }

  return {
    text: nextValue.slice(prefixLength, nextValue.length - suffixLength),
    usedSelection: false
  };
}

function splitTerminator(value: string) {
  const terminatorIndex = value.search(/[\r\n\t]/);
  if (terminatorIndex === -1) {
    return { text: value, terminated: false };
  }
  return { text: value.slice(0, terminatorIndex), terminated: true };
}

function isPrintable(value: string) {
  return value.length > 0 && !/[\u0000-\u001f\u007f]/.test(value);
}

function isPlausibleBarcode(value: string) {
  if (value.length < MIN_SCAN_LENGTH || value.length > MAX_SCAN_LENGTH || /\s/.test(value)) {
    return false;
  }
  return true;
}

export function useBarcodeScanner(onBarcode: (value: string) => void) {
  const captureRef = useRef<ScanCapture | null>(null);
  const lastValuesRef = useRef<Record<string, string>>({});
  const selectionsRef = useRef<Record<string, Selection>>({});
  const onBarcodeRef = useRef(onBarcode);

  useEffect(() => {
    onBarcodeRef.current = onBarcode;
  }, [onBarcode]);

  const finishCapture = useCallback(
    (capture: ScanCapture, accept = true, explicitTerminator = false): CaptureResult => {
      if (capture.timer !== null) {
        clearTimeout(capture.timer);
      }
      if (captureRef.current === capture) {
        captureRef.current = null;
      }

      const barcode = capture.value.trim();
      const hasScanEvidence = explicitTerminator || capture.hasTerminator || capture.eventCount >= MIN_SCAN_EVENTS;
      if (!accept || !hasScanEvidence || !isPlausibleBarcode(barcode)) {
        capture.setValue(capture.lastValue);
        lastValuesRef.current[capture.field] = capture.lastValue;
        return { value: capture.lastValue, accepted: false };
      }

      const value = capture.field === 'barcode' ? barcode : capture.baseValue;
      capture.setValue(value);
      lastValuesRef.current[capture.field] = value;
      onBarcodeRef.current(barcode);
      return { value: barcode, accepted: true };
    },
    []
  );

  const scheduleFinish = useCallback((capture: ScanCapture) => {
    if (captureRef.current !== capture) {
      return;
    }
    if (capture.timer !== null) {
      clearTimeout(capture.timer);
    }
    const timer = setTimeout(() => {
      const current = captureRef.current;
      if (current?.timer === timer) {
        finishCapture(current);
      }
    }, SCAN_TIMEOUT_MS);
    captureRef.current = { ...capture, timer };
  }, [finishCapture]);

  const handleFieldChange = useCallback(
    (field: string, currentValue: string, nextValue: string, setValue: SetValue) => {
      const now = Date.now();
      const previousValue = Object.prototype.hasOwnProperty.call(lastValuesRef.current, field)
        ? lastValuesRef.current[field]
        : currentValue;
      let capture = captureRef.current;

      if (
        capture &&
        (capture.field !== field ||
          now - capture.lastKeyAt > MAX_KEY_GAP_MS ||
          now - capture.startedAt > MAX_SCAN_DURATION_MS)
      ) {
        finishCapture(capture, false);
        capture = null;
      }

      if (field !== 'barcode') {
        if (capture) {
          finishCapture(capture, false);
        }
        lastValuesRef.current[field] = nextValue;
        setValue(nextValue);
        return;
      }

      const selection = selectionsRef.current[field];
      const { text: inserted, usedSelection } = getInsertedText(previousValue, nextValue, selection);
      if (inserted === '' && nextValue !== previousValue) {
        if (capture) {
          finishCapture(capture, false);
        }
        lastValuesRef.current[field] = nextValue;
        setValue(nextValue);
        return;
      }

      const { text, terminated } = splitTerminator(inserted);
      const updateSelectionAfterInsertion = (insertedText: string) => {
        if (usedSelection && selection && !terminated && insertedText) {
          const position = selection.start + insertedText.length;
          selectionsRef.current[field] = { start: position, end: position };
        }
      };
      if (!text && !terminated) {
        if (capture) {
          finishCapture(capture, false);
        }
        lastValuesRef.current[field] = nextValue;
        setValue(nextValue);
        return;
      }
      if (text && !isPrintable(text)) {
        if (capture) {
          finishCapture(capture, false);
        }
        lastValuesRef.current[field] = nextValue;
        setValue(nextValue);
        return;
      }
      if (text.length > MAX_SCAN_LENGTH) {
        if (capture) {
          finishCapture(capture, false);
        }
        lastValuesRef.current[field] = nextValue;
        setValue(nextValue);
        return;
      }

      if (!capture) {
        if (!text) {
          lastValuesRef.current[field] = nextValue;
          setValue(nextValue);
          return;
        }
        capture = {
          field,
          baseValue: previousValue,
          lastValue: nextValue,
          value: text,
          setValue,
          startedAt: now,
          lastKeyAt: now,
          hasTerminator: terminated,
          eventCount: 1,
          timer: null,
        };
        captureRef.current = capture;
        lastValuesRef.current[field] = nextValue;
        updateSelectionAfterInsertion(text);
        setValue(nextValue);

        if (terminated && text.length >= MIN_SCAN_LENGTH) {
          finishCapture(capture);
        } else {
          scheduleFinish(capture);
        }
        return;
      }

      const nextCapture = {
        ...capture,
        lastValue: nextValue,
        value: capture.value + text,
        lastKeyAt: now,
        hasTerminator: capture.hasTerminator || terminated,
        eventCount: capture.eventCount + 1,
      };
      captureRef.current = nextCapture;
      capture = nextCapture;

      if (terminated && capture.value.length < MIN_SCAN_LENGTH) {
        finishCapture(capture, false);
        return;
      }
      if (terminated && capture.value.length >= MIN_SCAN_LENGTH) {
        finishCapture(capture);
        return;
      }

      lastValuesRef.current[field] = nextValue;
      updateSelectionAfterInsertion(text);
      capture.setValue(nextValue);
      scheduleFinish(capture);
    },
    [finishCapture, scheduleFinish]
  );

  const flushCapture = useCallback(() => {
    const capture = captureRef.current;
    return capture ? finishCapture(capture) : null;
  }, [finishCapture]);

  const handleSelectionChange = useCallback((field: string, selection: Selection) => {
    selectionsRef.current[field] = {
      start: selection.start,
      end: selection.end
    };
  }, []);

  const handleFieldSubmit = useCallback(
    (field: string, setValue: SetValue) => {
      const capture = captureRef.current;
      if (capture && capture.field !== field) {
        finishCapture(capture, false);
      }
      const currentCapture = captureRef.current;
      if (currentCapture?.field === field && currentCapture.value.length >= MIN_SCAN_LENGTH) {
        finishCapture(currentCapture, true, true);
        return;
      }
      if (currentCapture?.field === field) {
        finishCapture(currentCapture, false);
        return;
      }
      const currentValue = lastValuesRef.current[field];
      if (currentValue !== undefined) {
        setValue(currentValue);
      }
    },
    [finishCapture]
  );

  useEffect(() => {
    return () => {
      const capture = captureRef.current;
      if (capture?.timer !== null && capture?.timer !== undefined) {
        clearTimeout(capture.timer);
      }
      captureRef.current = null;
    };
  }, []);

  return { handleFieldChange, handleFieldSubmit, handleSelectionChange, flushCapture };
}
