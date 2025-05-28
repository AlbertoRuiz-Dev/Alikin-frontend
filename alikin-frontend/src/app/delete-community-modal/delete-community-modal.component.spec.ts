import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteCommunityModalComponent } from './delete-community-modal.component';

describe('DeleteCommunityModalComponent', () => {
  let component: DeleteCommunityModalComponent;
  let fixture: ComponentFixture<DeleteCommunityModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeleteCommunityModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteCommunityModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
