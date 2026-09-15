from dataclasses import dataclass
import torch


@dataclass
class MultimodalCollator:
    processor: "Qwen2_5_VLProcessor"
    max_length: int = 4096

    def __call__(self, features):
        assert self.processor.tokenizer.padding_side == "right", (
            "Collator assumes right padding for prefix-mask alignment"
        )

        texts = []
        images = []

        for f in features:
            msgs = f["messages"] + [{"role": "assistant", "content": f["answer"]}]
            text = self.processor.apply_chat_template(
                msgs, tokenize=False, add_generation_prompt=False
            )
            texts.append(text)
            images.append(f["image"])

        batch = self.processor(
            text=texts,
            images=images,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=self.max_length,
        )

        # Assert no sample hit the cap — otherwise answers may be truncated
        actual_len = batch["input_ids"].shape[1]
        assert actual_len < self.max_length, (
            f"Sample hit max_length={self.max_length} at seq_len={actual_len} "
            "— answers may be truncated. Increase max_length."
        )

        labels = batch["input_ids"].clone()
        labels[batch["attention_mask"] == 0] = -100

        for i, f in enumerate(features):
            prompt_text = self.processor.apply_chat_template(
                f["messages"], tokenize=False, add_generation_prompt=True
            )
            prompt_ids = self.processor.tokenizer(
                prompt_text, add_special_tokens=False
            )["input_ids"]
            n = len(prompt_ids)
            assert batch["input_ids"][i, :n].tolist() == prompt_ids, (
                f"Prompt prefix mismatch for sample {i} — "
                "tokenizer non-determinism detected"
            )
            labels[i, :n] = -100

        batch["labels"] = labels
        return batch
