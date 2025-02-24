"""
This file contains the routes for the datalake blueprint.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from utils.database import get_collection

# Create a new FastAPI router
router = APIRouter(
    tags=["datalake"]
)

# Get the collection
collection = get_collection("datalake")

# Get all documents
@router.get("/")
async def get_all_documents():
    documents = await collection.find().to_list(length=None)
    return documents

# Get a document by its ID
@router.get("/{document_id}")
async def get_document_by_id(document_id: str):
    document = await collection.find_one({"_id": document_id})
    if document:
        return document
    else:
        raise HTTPException(status_code=404, detail="Document not found")
    
# Create a new document
@router.post("/")
async def create_document(document: dict):
    result = await collection.insert_one(document)
    return JSONResponse(content={"_id": str(result.inserted_id)}, status_code=201)

# Update a document by its ID
@router.put("/{document_id}")
async def update_document(document_id: str, document: dict):
    result = await collection.replace_one({"_id": document_id}, document)
    if result.modified_count:
        return JSONResponse(content={"message": "Document updated successfully"})
    else:
        raise HTTPException(status_code=404, detail="Document not found")
    
# Delete a document by its ID
@router.delete("/{document_id}")
async def delete_document(document_id: str):
    result = await collection.delete_one({"_id": document_id})
    if result.deleted_count:
        return JSONResponse(content={"message": "Document deleted successfully"})
    else:
        raise HTTPException(status_code=404, detail="Document not found")
    
# Delete all documents
@router.delete("/")
async def delete_all_documents():
    result = await collection.delete_many({})
    return JSONResponse(content={"message": f"{result.deleted_count} documents deleted successfully"})

# Get the number of documents
@router.get("/count")
async def count_documents():
    count = await collection.count_documents({})
    return JSONResponse(content={"count": count})