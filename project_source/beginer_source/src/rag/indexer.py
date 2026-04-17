from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma


def build_vector_index(
    chunks: list[dict],
    persist_directory: str,
    embedding_model: str,
    collection_name: str = "support_docs",
):
    documents = [
        Document(
            page_content=chunk["text"],
            metadata={
                "source_url": chunk["source_url"],
                "chunk_id": chunk["chunk_id"],
                "title": chunk.get("title", ""),
            },
        )
        for chunk in chunks
    ]
    embeddings = HuggingFaceEmbeddings(model_name=embedding_model)
    return Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        collection_name=collection_name,
        persist_directory=persist_directory,
    )
